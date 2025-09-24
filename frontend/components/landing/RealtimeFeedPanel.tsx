"use client";

import { useMemo } from "react";
import type { LandingCopy } from "@/i18n/content/types";
import type { ListingEvent } from "@/types/listings";

interface RealtimeFeedPanelProps {
  copy: LandingCopy;
  locale: string;
  events: ListingEvent[];
  connected: boolean;
}

const DEFAULT_AVAILABILITY_COPY = {
  coverageTitle: "Global derivatives coverage",
  availableLabel: "Listed",
  unavailableLabel: "Not listed",
  unknownLabel: "Awaiting exchange diagnostics",
  updatedLabel: "Checked",
};

export function RealtimeFeedPanel({
  copy,
  locale,
  events,
  connected,
}: RealtimeFeedPanelProps) {
  const availabilityCopy = copy.realtimeAvailability ?? DEFAULT_AVAILABILITY_COPY;

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
                    <ul className="mt-2 space-y-2">
                      {event.marketsSnapshot.map((market) => {
                        const statusLabel = market.available
                          ? availabilityCopy.availableLabel
                          : availabilityCopy.unavailableLabel;
                        const containerClasses = market.available
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-rose-500/40 bg-rose-500/10";
                        const statusClasses = market.available
                          ? "text-emerald-300"
                          : "text-rose-300";
                        return (
                          <li
                            key={`${event.id ?? event.symbol}-${market.exchange}`}
                            className={`rounded-lg border px-3 py-2 ${containerClasses}`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                                  {market.exchange}
                                </p>
                                {!market.available && market.error && (
                                  <p className="text-[11px] text-rose-300">
                                    {market.error}
                                  </p>
                                )}
                              </div>
                              <div className="text-left sm:text-right">
                                <p className={`text-xs font-semibold ${statusClasses}`}>
                                  {statusLabel}
                                </p>
                                {market.checkedAt && (
                                  <p className="text-[11px] text-slate-400">
                                    {availabilityCopy.updatedLabel}:{" "}
                                    {new Date(market.checkedAt).toLocaleTimeString(locale, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      {availabilityCopy.unknownLabel}
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
