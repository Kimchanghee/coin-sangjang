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

interface ListingPayload {
  source: "UPBIT" | "BITHUMB";
  symbol: string;
  announcedAt: string;
  payload?: Record<string, unknown>;
}

class ListingIngestor {
  private readonly targets = ["UPBIT", "BITHUMB"] as const;

  async start() {
    logger.info(
      {
        backend: BACKEND_URL,
        pubsubTopic: PUBSUB_TOPIC || null,
        projectId: PROJECT_ID || null,
      },
      "starting listing ingest loops",
    );
    this.targets.forEach((source) => void this.bootstrapMockLoop(source));
  }

  private async bootstrapMockLoop(source: ListingPayload["source"]) {
    // TODO: Replace with actual upstream websocket endpoints or scraping bridge.
    logger.warn({ source }, "No official websocket documented. Using mock timer.");
    setInterval(() => {
      const mockSymbol = `${source}-MOCK-${Math.floor(Math.random() * 999)}`;
      void this.handleListing({
        source,
        symbol: mockSymbol,
        announcedAt: new Date().toISOString(),
      });
    }, 30_000);
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
}

void new ListingIngestor().start();
