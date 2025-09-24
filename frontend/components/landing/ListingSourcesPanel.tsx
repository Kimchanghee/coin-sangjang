"use client";

import { useMemo } from "react";

import type { CollectorCopy } from "@/i18n/content/types";
import type { ListingEvent } from "@/types/listings";

interface ListingSourcesPanelProps {
  copy?: CollectorCopy;
  events: ListingEvent[];
  connected: boolean;
  locale: string;
  lastSyncedAt?: string | null;
}

const DEFAULT_COPY: CollectorCopy = {
  title: "Realtime collectors",
  description:
    "Monitor Upbit and Bithumb announcement streams in realtime and feed the orchestrator when listings hit.",
  upbitLabel: "Upbit announcements",
  bithumbLabel: "Bithumb announcements",
  orchestratorLabel: "Execution orchestrator",
  lastSeenLabel: "Last seen",
  noSignalsLabel: "No recent announcements",
  idleLabel: "Idle",
  activeLabel: "Receiving",
  recentSymbolsLabel: "Latest detected symbols",
};

const SOURCE_ORDER: Array<{ source: string; copyKey: keyof CollectorCopy }> = [
  { source: "UPBIT", copyKey: "upbitLabel" },
  { source: "BITHUMB", copyKey: "bithumbLabel" },
];

const ACTIVE_WINDOW_MS = 1000 * 60 * 30; // 30 minutes

export function ListingSourcesPanel({
  copy,
  events,
  connected,
  locale,
  lastSyncedAt,
}: ListingSourcesPanelProps) {
  const strings = copy ?? DEFAULT_COPY;

  const lastBySource = useMemo(() => {
    const map = new Map<string, ListingEvent>();
    for (const event of events) {
      const previous = map.get(event.source);
      if (!previous) {
        map.set(event.source, event);
        continue;
      }
      if (
        new Date(event.announcedAt).getTime() >
        new Date(previous.announcedAt).getTime()
      ) {
        map.set(event.source, event);
      }
    }
    return map;
  }, [events]);

  const trendingSymbols = useMemo(() => {
    const unique = new Set<string>();
    const symbols: string[] = [];
    for (const event of events) {
      const base = event.baseSymbol ?? event.symbol.replace(/USDT$/i, "");
      if (!base) {
        continue;
      }
      if (!unique.has(base)) {
        unique.add(base);
        symbols.push(base);
      }
      if (symbols.length >= 4) {
        break;
      }
    }
    return symbols;
  }, [events]);

  const latestEventTimestamp = useMemo(() => {
    const timestamps = events.map((event) => new Date(event.announcedAt).getTime());
    if (timestamps.length === 0) {
      return null;
    }
    return new Date(Math.max(...timestamps)).toISOString();
  }, [events]);

  const orchestratorTimestamp = lastSyncedAt ?? latestEventTimestamp;

  const formatTimestamp = (timestamp?: string | null) => {
    if (!timestamp) {
      return null;
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const renderSourceCard = (source: string, label: string) => {
    const latest = lastBySource.get(source);
    const timestamp = latest?.announcedAt ?? null;
    const formattedTime = formatTimestamp(timestamp);
    const isActive =
      !!timestamp && new Date().getTime() - new Date(timestamp).getTime() < ACTIVE_WINDOW_MS;

    return (
      <article
        key={source}
        className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
      >
        <header className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            {label}
          </h4>
          <span
            className={`text-xs font-semibold ${
              isActive ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {isActive ? strings.activeLabel : strings.idleLabel}
          </span>
        </header>
        <div className="space-y-1 text-xs text-slate-300">
          <p>
            {strings.lastSeenLabel}:{" "}
            {formattedTime ?? strings.noSignalsLabel}
          </p>
          {latest?.symbol && (
            <p className="font-mono text-[11px] uppercase text-slate-400">
              {latest.symbol}
            </p>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">{strings.title}</h3>
        <p className="text-sm text-slate-300">{strings.description}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {SOURCE_ORDER.map(({ source, copyKey }) =>
          renderSourceCard(source, strings[copyKey] as string),
        )}
        <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <header className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              {strings.orchestratorLabel}
            </h4>
            <span
              className={`text-xs font-semibold ${
                connected ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {connected ? strings.activeLabel : strings.idleLabel}
            </span>
          </header>
          <div className="space-y-2 text-xs text-slate-300">
            <p>
              {strings.lastSeenLabel}:{" "}
              {formatTimestamp(orchestratorTimestamp) ?? strings.noSignalsLabel}
            </p>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {strings.recentSymbolsLabel}
              </p>
              {trendingSymbols.length === 0 ? (
                <p className="text-[11px] text-slate-500">{strings.noSignalsLabel}</p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {trendingSymbols.map((symbol) => (
                    <li
                      key={symbol}
                      className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase text-slate-200"
                    >
                      {symbol}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
