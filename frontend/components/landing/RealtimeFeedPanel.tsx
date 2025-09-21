"use client";

import { useEffect, useMemo, useState } from "react";
import type { LandingCopy } from "@/i18n/content/types";

interface MarketSnapshot {
  exchange: string;
  available: boolean;
  checkedAt?: string;
  error?: string;
}

interface ListingEvent {
  id?: string;
  source: string;
  symbol: string;
  baseSymbol?: string;
  announcedAt: string;
  marketsSnapshot?: MarketSnapshot[];
}

interface RealtimeFeedPanelProps {
  copy: LandingCopy;
  locale: string;
}

const FALLBACK_EVENTS: ListingEvent[] = [
  {
    source: "UPBIT",
    symbol: "BTCUSDT",
    baseSymbol: "BTC",
    announcedAt: new Date().toISOString(),
    marketsSnapshot: [
      {
        exchange: "BINANCE",
        available: true,
        checkedAt: new Date().toISOString(),
      },
      {
        exchange: "BYBIT",
        available: true,
        checkedAt: new Date().toISOString(),
      },
    ],
  },
  {
    source: "BITHUMB",
    symbol: "APTUSDT",
    baseSymbol: "APT",
    announcedAt: new Date().toISOString(),
    marketsSnapshot: [
      {
        exchange: "BINANCE",
        available: true,
        checkedAt: new Date().toISOString(),
      },
      {
        exchange: "OKX",
        available: false,
        checkedAt: new Date().toISOString(),
        error: "Awaiting listing",
      },
    ],
  },
];

const DEFAULT_AVAILABILITY_COPY = {
  coverageTitle: "Global derivatives coverage",
  availableLabel: "Listed",
  unavailableLabel: "Not listed",
  unknownLabel: "Awaiting exchange diagnostics",
  updatedLabel: "Checked",
};

export function RealtimeFeedPanel({ copy, locale }: RealtimeFeedPanelProps) {
  const [events, setEvents] = useState<ListingEvent[]>(FALLBACK_EVENTS);
  const [connected, setConnected] = useState(false);
  const availabilityCopy = copy.realtimeAvailability ?? DEFAULT_AVAILABILITY_COPY;

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api",
    [],
  );

  useEffect(() => {
    let active = true;
    const fetchRecent = async () => {
      try {
        const response = await fetch(`${apiBase}/listings/recent`);
        if (!response.ok) {
          throw new Error(`failed to fetch listings: ${response.status}`);
        }
        const data = (await response.json()) as ListingEvent[];
        if (active && Array.isArray(data) && data.length > 0) {
          setEvents(data);
        }
      } catch (error) {
        console.warn("Failed to load recent listings", error);
      }
    };
    void fetchRecent();
    return () => {
      active = false;
    };
  }, [apiBase]);

  useEffect(() => {
    const streamUrl = `${apiBase}/listings/stream`;
    let source: EventSource | null = null;
    try {
      source = new EventSource(streamUrl, { withCredentials: false });
      source.onopen = () => setConnected(true);
      source.onerror = () => setConnected(false);
      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ListingEvent;
          setEvents((prev) => {
            const next = [payload, ...prev];
            const unique = new Map<string, ListingEvent>();
            for (const item of next) {
              const key = item.id ?? `${item.source}-${item.symbol}-${item.announcedAt}`;
              if (!unique.has(key)) {
                unique.set(key, item);
              }
            }
            return Array.from(unique.values()).slice(0, 20);
          });
        } catch (error) {
          console.warn("Invalid SSE listing payload", error);
        }
      };
    } catch (error) {
      console.warn("EventSource unavailable", error);
    }

    return () => {
      source?.close();
    };
  }, [apiBase]);

  const status = connected ? copy.realtimeStatusConnected : copy.realtimeStatusIdle;

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.announcedAt).getTime() - new Date(a.announcedAt).getTime(),
    );
  }, [events]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{copy.realtimeTitle}</h2>
          <p className="text-xs text-slate-300">{status}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`} />
      </header>
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-slate-400">{availabilityCopy.unknownLabel}</p>
        ) : (
          sortedEvents.map((event) => {
            const baseSymbol = event.baseSymbol ?? event.symbol.replace(/USDT$/i, "");
            return (
              <article
                key={event.id ?? `${event.source}-${event.symbol}-${event.announcedAt}`}
                className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-100">
                      {event.source} · {baseSymbol}
                    </p>
                    <p className="text-xs text-slate-400">{event.symbol}</p>
                  </div>
                  <time className="text-xs text-slate-300" suppressHydrationWarning>
                    {new Date(event.announcedAt).toLocaleString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </header>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {availabilityCopy.coverageTitle}
                  </p>
                  {event.marketsSnapshot && event.marketsSnapshot.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {event.marketsSnapshot.map((market) => (
                        <li
                          key={`${event.id ?? event.symbol}-${market.exchange}`}
                          className={`flex items-center justify-between gap-3 rounded-full px-3 py-1 text-xs font-semibold transition ${
                            market.available
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/10 text-rose-200"
                          }`}
                        >
                          <span className="flex flex-col">
                            <span>{market.exchange}</span>
                            {!market.available && market.error && (
                              <span className="text-[10px] font-normal text-rose-100/80">
                                {market.error}
                              </span>
                            )}
                          </span>
                          <span>
                            {market.available
                              ? availabilityCopy.availableLabel
                              : availabilityCopy.unavailableLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      {availabilityCopy.unknownLabel}
                    </p>
                  )}
                  {event.marketsSnapshot && event.marketsSnapshot.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {availabilityCopy.updatedLabel}:{" "}
                      {new Date(
                        event.marketsSnapshot[0]?.checkedAt ?? event.announcedAt,
                      ).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
