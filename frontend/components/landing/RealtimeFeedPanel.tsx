"use client";

import { useEffect, useMemo, useState } from "react";
import type { LandingCopy } from "@/i18n/content/types";

interface ListingEvent {
  source: string;
  symbol: string;
  scheduledAt: string;
}

interface RealtimeFeedPanelProps {
  copy: LandingCopy;
  locale: string;
}

const FALLBACK_EVENTS: ListingEvent[] = [
  { source: "Upbit", symbol: "ABC", scheduledAt: new Date().toISOString() },
  { source: "Bithumb", symbol: "XYZ", scheduledAt: new Date().toISOString() },
];

export function RealtimeFeedPanel({ copy, locale }: RealtimeFeedPanelProps) {
  const [events, setEvents] = useState<ListingEvent[]>(FALLBACK_EVENTS);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_LISTING_WS ?? "ws://localhost:4000/listings";
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.addEventListener("open", () => setConnected(true));
      ws.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as ListingEvent;
          setEvents((prev) => [payload, ...prev].slice(0, 20));
        } catch (error) {
          console.warn("Invalid listing payload", error);
        }
      });
      ws.addEventListener("close", () => setConnected(false));
    } catch (error) {
      console.warn("WebSocket unavailable", error);
    }

    return () => ws?.close();
  }, [locale]);

  const status = connected ? copy.realtimeStatusConnected : copy.realtimeStatusIdle;

  const grouped = useMemo(() => {
    return events.reduce<Record<string, ListingEvent[]>>((acc, curr) => {
      acc[curr.source] = acc[curr.source] ? [curr, ...acc[curr.source]] : [curr];
      return acc;
    }, {});
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
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([source, items]) => (
          <article key={source} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <header className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{source}</h3>
              <span className="text-xs text-slate-400">{items.length} events</span>
            </header>
            <ul className="space-y-2 text-xs text-slate-200">
              {items.map((item, index) => (
                <li key={`${item.symbol}-${index}`} className="flex justify-between">
                  <span>{item.symbol}</span>
                  <time suppressHydrationWarning>
                    {new Date(item.scheduledAt).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
