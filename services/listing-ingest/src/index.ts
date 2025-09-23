import axios from "axios";
import Pino from "pino";
import { config as loadEnv } from "dotenv";
import { PubSub } from "@google-cloud/pubsub";

loadEnv();

const logger = Pino({ name: "listing-ingest" });

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000/api";
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC ?? "";
const PROJECT_ID = process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT ?? "";

const pubsubClient = PUBSUB_TOPIC ? new PubSub({ projectId: PROJECT_ID || undefined }) : null;

type ListingSource = "UPBIT" | "BITHUMB";

interface ListingPayload {
  source: ListingSource;
  symbol: string;
  announcedAt: string;
  payload?: Record<string, unknown>;
}

const UPBIT_ENDPOINT = "https://api-manager.upbit.com/api/v1/notices";
const BITHUMB_ENDPOINTS = [
  "https://capi.bithumb.com/public/board/7",
  "https://capi.bithumb.com/public/board/5",
];

const LISTING_KEYWORD_PATTERNS: RegExp[] = [
  /상장(?!\s*폐지)/i,
  /거래\s*지원/i,
  /listing/i,
  /market\s*support/i,
  /원화\s*마켓/i,
  /usdt\s*마켓/i,
  /신규\s*(코인)?\s*상장/i,
];

const LISTING_NEGATIVE_PATTERNS: RegExp[] = [
  /상장\s*폐지/i,
  /거래\s*지원\s*종료/i,
  /거래\s*종료/i,
  /유의\s*종목/i,
  /delisting/i,
  /suspension/i,
];

const UPBIT_CATEGORY_KEYS = [
  "category",
  "categoryName",
  "noticeType",
  "notice_type",
  "type",
  "noticeCategory",
];

const BITHUMB_CATEGORY_KEYS = [
  "menuCd",
  "menuCode",
  "menuNm",
  "menuName",
  "category",
  "categoryNm",
  "boardCd",
  "boardType",
  "boardName",
  "noticeType",
  "noticeCode",
];

const TAG_KEYS = ["tags", "tagNames", "tag_names", "hashTags", "hash_tags"];

class ListingIngestor {
  private readonly seen: Record<ListingSource, Set<string>> = {
    UPBIT: new Set<string>(),
    BITHUMB: new Set<string>(),
  };

  private readonly fallbackTicker: Record<ListingSource, number> = {
    UPBIT: 0,
    BITHUMB: 0,
  };

  async start() {
    logger.info(
      {
        backend: BACKEND_URL,
        pubsubTopic: PUBSUB_TOPIC || null,
        projectId: PROJECT_ID || null,
      },
      "starting listing ingest loops",
    );

    await Promise.allSettled([this.pollUpbit(), this.pollBithumb()]);

    setInterval(() => {
      void this.pollUpbit();
    }, 25_000);

    setInterval(() => {
      void this.pollBithumb();
    }, 30_000);
  }

  private async pollUpbit() {
    try {
      const response = await axios.get(UPBIT_ENDPOINT, {
        params: { page: 1, per_page: 30, is_pinned: false, category: "listing" },
        timeout: 7_000,
        headers: { "User-Agent": "coin-sangjang-listing-ingestor/1.0" },
      });

      const notices = this.normaliseCollection(response.data);

      for (const notice of notices) {
        const id = this.extractId(notice, ["id", "uuid", "notice_id", "seq", "article_id"]);
        if (!id || this.seen.UPBIT.has(id)) {
          continue;
        }
        const title = String(notice.title ?? notice.subject ?? "");
        if (!title) {
          continue;
        }
        const normalizedNotice = { ...notice, title };
        if (!this.isListingNotice("UPBIT", normalizedNotice)) {
          this.seen.UPBIT.add(id);
          continue;
        }

        const announcedAt = this.parseTimestamp(
          notice.created_at ?? notice.posted_at ?? notice.reg_date,
        );
        const baseSymbol = this.extractBaseSymbol(title, notice.body ?? notice.content);
        const normalizedSymbol = this.normalizeSymbol(
          notice.symbol ?? notice.code ?? baseSymbol,
        );

        if (!normalizedSymbol) {
          logger.debug({ title }, "Upbit listing missing symbol, skipping");
          this.seen.UPBIT.add(id);
          continue;
        }

        this.seen.UPBIT.add(id);
        await this.handleListing({
          source: "UPBIT",
          symbol: normalizedSymbol,
          announcedAt,
          payload: {
            id,
            baseSymbol,
            title,
            category: notice.category ?? null,
            link: this.buildUpbitUrl(id),
            raw: notice,
          },
        });
      }
    } catch (error) {
      logger.error({ err: error }, "failed to poll Upbit notices");
      this.emitResilienceSample("UPBIT");
    }
  }

  private async pollBithumb() {
    for (const endpoint of BITHUMB_ENDPOINTS) {
      try {
        const response = await axios.get(endpoint, {
          timeout: 7_000,
          headers: { "User-Agent": "coin-sangjang-listing-ingestor/1.0" },
        });

        const notices = this.normaliseCollection(response.data);
        if (!notices.length) {
          continue;
        }

        for (const notice of notices) {
          const id = this.extractId(notice, [
            "id",
            "noticeId",
            "article_id",
            "seq",
            "boardSeq",
          ]);
          if (!id || this.seen.BITHUMB.has(id)) {
            continue;
          }
          const title = String(notice.title ?? notice.subject ?? "");
          if (!title) {
            continue;
          }
          const normalizedNotice = { ...notice, title };
          if (!this.isListingNotice("BITHUMB", normalizedNotice)) {
            this.seen.BITHUMB.add(id);
            continue;
          }

          const announcedAt = this.parseTimestamp(
            notice.createdAt ?? notice.regDate ?? notice.postDate,
          );
          const baseSymbol = this.extractBaseSymbol(
            title,
            notice.content ?? notice.body ?? notice.description,
          );
          const normalizedSymbol = this.normalizeSymbol(
            notice.symbol ?? notice.code ?? baseSymbol,
          );

          if (!normalizedSymbol) {
            logger.debug({ title }, "Bithumb listing missing symbol, skipping");
            this.seen.BITHUMB.add(id);
            continue;
          }

          this.seen.BITHUMB.add(id);
          await this.handleListing({
            source: "BITHUMB",
            symbol: normalizedSymbol,
            announcedAt,
            payload: {
              id,
              baseSymbol,
              title,
              link: this.buildBithumbUrl(id, notice),
              raw: notice,
            },
          });
        }

        return;
      } catch (error) {
        logger.warn({ endpoint, err: error }, "bithumb endpoint failed, trying next");
        continue;
      }
    }

    logger.error("all bithumb endpoints failed");
    this.emitResilienceSample("BITHUMB");
  }

  private buildUpbitUrl(id: string) {
    return `https://api-manager.upbit.com/api/v1/notices/${encodeURIComponent(id)}`;
  }

  private buildBithumbUrl(id: string, notice: Record<string, unknown>) {
    if (typeof notice?.link === "string") {
      return notice.link;
    }
    if (typeof notice?.url === "string") {
      return notice.url;
    }
    return `https://www.bithumb.com/notice/detail/${encodeURIComponent(id)}`;
  }

  private normaliseCollection(data: unknown): Array<Record<string, any>> {
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data as Array<Record<string, any>>;
    }
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return this.normaliseCollection(parsed);
      } catch {
        const matches = Array.from(
          data.matchAll(/data-article-id="(\d+)"[^>]*>([^<]+)</gi),
        );
        return matches.map((match) => ({
          id: match[1],
          title: match[2],
          content: data,
        }));
      }
    }
    if (typeof data === "object") {
      const candidateKeys = ["data", "list", "content", "items", "notices"];
      for (const key of candidateKeys) {
        const value = (data as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          return value as Array<Record<string, any>>;
        }
      }
    }
    return [];
  }

  private extractId(
    record: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const value = record?.[key];
      if (typeof value === "number" || typeof value === "string") {
        const text = String(value);
        if (text.trim().length > 0) {
          return text;
        }
      }
    }
    return undefined;
  }

  private isListingNotice(
    source: ListingSource,
    notice: Record<string, unknown>,
  ): boolean {
    const candidates = new Set<string>();
    const prime = (...values: unknown[]) => {
      for (const value of values) {
        for (const item of this.flattenStringValues(value)) {
          candidates.add(item);
        }
      }
    };

    prime(
      notice.title,
      notice.subject,
      notice.summary,
      notice.body,
      notice.content,
      notice.description,
    );

    for (const key of source === "UPBIT" ? UPBIT_CATEGORY_KEYS : BITHUMB_CATEGORY_KEYS) {
      prime((notice as Record<string, unknown>)[key]);
    }

    for (const key of TAG_KEYS) {
      prime((notice as Record<string, unknown>)[key]);
    }

    const title = this.flattenStringValues(notice.title).join(" ");
    const body = this.flattenStringValues(notice.body ?? notice.content).join(" ");
    if (title || body) {
      prime(`${title} ${body}`.trim());
    }

    for (const candidate of candidates) {
      if (this.matchesListingKeywords(candidate)) {
        return true;
      }
    }

    return false;
  }

  private matchesListingKeywords(text: string): boolean {
    if (!text) {
      return false;
    }
    const normalized = text.trim();
    if (!normalized) {
      return false;
    }
    if (LISTING_NEGATIVE_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return false;
    }
    return LISTING_KEYWORD_PATTERNS.some((pattern) => pattern.test(normalized));
  }

  private flattenStringValues(value: unknown): string[] {
    if (value === null || value === undefined) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item) => this.flattenStringValues(item));
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return [String(value)];
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const keys = ["name", "label", "value", "title"];
      const collected: string[] = [];
      for (const key of keys) {
        collected.push(...this.flattenStringValues(record[key]));
      }
      return collected;
    }
    return [];
  }

  private parseTimestamp(value: unknown) {
    if (typeof value === "number") {
      return new Date(value).toISOString();
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  }

  private extractBaseSymbol(
    title?: string,
    content?: string,
  ): string | undefined {
    const candidates = [title, content].filter(
      (value): value is string => typeof value === "string",
    );
    for (const candidate of candidates) {
      const upper = candidate.toUpperCase();
      const paren = upper.match(/\(([A-Z0-9]{2,10})\)/);
      if (paren) {
        return paren[1];
      }
      const market = upper.match(/(?:KRW|BTC|USDT)[\s-/]*([A-Z0-9]{2,10})/);
      if (market) {
        return market[1];
      }
      const hashtag = upper.match(/#([A-Z0-9]{2,10})/);
      if (hashtag) {
        return hashtag[1];
      }
    }
    return undefined;
  }

  private normalizeSymbol(symbol?: string | null) {
    if (!symbol) {
      return undefined;
    }
    const sanitized = symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (!sanitized) {
      return undefined;
    }
    if (sanitized.endsWith("USDT")) {
      return sanitized;
    }
    return `${sanitized}USDT`;
  }

  private async handleListing(listing: ListingPayload) {
    logger.info({ listing }, "Forwarding listing event");
    if (pubsubClient && PUBSUB_TOPIC) {
      await this.publishToPubSub(listing);
    } else {
      await this.postDirectly(listing);
    }
  }

  private async publishToPubSub(listing: ListingPayload) {
    try {
      const dataBuffer = Buffer.from(JSON.stringify(listing));
      await pubsubClient!.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer });
      logger.debug({ topic: PUBSUB_TOPIC }, "published listing to pubsub topic");
    } catch (error) {
      logger.error({ err: error }, "failed to publish to pubsub, falling back to http");
      await this.postDirectly(listing);
    }
  }

  private async postDirectly(listing: ListingPayload) {
    try {
      await axios.post(`${BACKEND_URL}/listings/mock`, listing, {
        timeout: 5_000,
      });
    } catch (error) {
      logger.error({ err: error }, "failed to deliver listing payload");
    }
  }

  private emitResilienceSample(source: ListingSource) {
    const now = Date.now();
    if (now - this.fallbackTicker[source] < 120_000) {
      return;
    }
    this.fallbackTicker[source] = now;
    const base = source === "UPBIT" ? "UBT" : "BTH";
    const token = `${base}${now.toString(36).slice(-3).toUpperCase()}USDT`;
    void this.handleListing({
      source,
      symbol: token,
      announcedAt: new Date().toISOString(),
      payload: {
        baseSymbol: token.replace(/USDT$/, ""),
        fallback: true,
        note: "Fallback sample emitted due to upstream fetch failure",
      },
    });
  }
}

void new ListingIngestor().start();
