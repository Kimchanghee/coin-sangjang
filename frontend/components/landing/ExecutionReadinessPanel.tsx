"use client";

import { useMemo, useState } from "react";

import type { ExecutionPreviewCopy } from "@/i18n/content/types";
import type { ExecutionPreviewResult, ListingEvent } from "@/types/listings";

interface ExecutionReadinessPanelProps {
  copy?: ExecutionPreviewCopy;
  apiBase: string;
  events: ListingEvent[];
}

type NetworkMode = "MAINNET" | "TESTNET";

const DEFAULT_COPY: ExecutionPreviewCopy = {
  title: "Exchange readiness checker",
  description:
    "Input a symbol to inspect listing readiness across Binance, Bybit, OKX, Gate.io, and Bitget.",
  placeholder: "e.g. APT or APTUSDT",
  buttonLabel: "Check availability",
  testnetLabel: "Testnet",
  mainnetLabel: "Mainnet",
  modeToggle: "Prefer testnet",
  loadingLabel: "Querying exchanges…",
  readyLabel: "Ready",
  notReadyLabel: "Unavailable",
  errorLabel: "Failed to load diagnostics.",
  updatedLabel: "Checked",
  suggestionsLabel: "Recently detected symbols",
};

const EXCHANGE_LABELS: Record<string, string> = {
  BINANCE: "Binance",
  BYBIT: "Bybit",
  OKX: "OKX",
  GATEIO: "Gate.io",
  BITGET: "Bitget",
};

const normalizeSymbolInput = (raw: string) => {
  const sanitized = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (!sanitized) {
    return "";
  }
  if (sanitized.length <= 3) {
    return `${sanitized}USDT`;
  }
  if (!sanitized.endsWith("USDT") && sanitized.length <= 10) {
    return `${sanitized}USDT`;
  }
  return sanitized;
};

export function ExecutionReadinessPanel({
  copy,
  apiBase,
  events,
}: ExecutionReadinessPanelProps) {
  const strings = copy ?? DEFAULT_COPY;
  const [symbol, setSymbol] = useState("APTUSDT");
  const [mode, setMode] = useState<NetworkMode>("TESTNET");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionPreviewResult | null>(null);

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const event of events) {
      const base = event.baseSymbol ?? event.symbol.replace(/USDT$/i, "");
      if (!base) {
        continue;
      }
      const normalized = normalizeSymbolInput(base);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        list.push(normalized);
      }
      if (list.length >= 5) {
        break;
      }
    }
    return list;
  }, [events]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeSymbolInput(symbol);
    if (!normalized) {
      setError(strings.errorLabel);
      return;
    }
    await runLookup(normalized, mode);
  };

  const runLookup = async (input: string, nextMode: NetworkMode) => {
    const normalized = normalizeSymbolInput(input);
    if (!normalized) {
      setError(strings.errorLabel);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBase}/public/exchanges/availability/${encodeURIComponent(normalized)}?mode=${nextMode}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as ExecutionPreviewResult;
      setResult(data);
      setSymbol(normalized);
    } catch (err) {
      console.error("[execution-preview] failed", err);
      setError(strings.errorLabel);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (nextMode: NetworkMode) => {
    setMode(nextMode);
    void runLookup(symbol, nextMode);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">{strings.title}</h3>
        <p className="text-sm text-slate-300">{strings.description}</p>
      </header>
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {strings.suggestionsLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase text-slate-200 transition hover:bg-slate-700"
                onClick={() => void runLookup(item, mode)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder={strings.placeholder}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <div className="flex shrink-0 flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleMode("MAINNET")}
                className={`rounded-md border px-4 py-2 text-xs font-semibold transition ${
                  mode === "MAINNET"
                    ? "border-sky-500 bg-sky-500 text-slate-950"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                }`}
              >
                {strings.mainnetLabel}
              </button>
              <button
                type="button"
                onClick={() => toggleMode("TESTNET")}
                className={`rounded-md border px-4 py-2 text-xs font-semibold transition ${
                  mode === "TESTNET"
                    ? "border-sky-500 bg-sky-500 text-slate-950"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                }`}
              >
                {strings.testnetLabel}
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-500 md:text-left">
              {strings.modeToggle}
            </p>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-emerald-500 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          disabled={loading}
        >
          {loading ? strings.loadingLabel : strings.buttonLabel}
        </button>
      </form>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {result && (
        <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {result.symbol} · {mode === "TESTNET" ? strings.testnetLabel : strings.mainnetLabel}
              </p>
              <p
                className={`text-sm font-semibold ${
                  result.ready ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {result.ready ? strings.readyLabel : strings.notReadyLabel}
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              {strings.updatedLabel}:{" "}
              {result.diagnostics[0]?.checkedAt
                ? new Date(result.diagnostics[0].checkedAt).toLocaleString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"}
            </p>
          </header>
          <ul className="space-y-2">
            {result.diagnostics.map((diagnostic) => {
              const label = EXCHANGE_LABELS[diagnostic.exchange] ?? diagnostic.exchange;
              const available = diagnostic.available || diagnostic.ready;
              return (
                <li
                  key={diagnostic.exchange}
                  className={`rounded-lg border px-3 py-2 ${
                    available
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-rose-500/40 bg-rose-500/10"
                  }`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                        {label}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {diagnostic.message ?? (available ? strings.readyLabel : strings.notReadyLabel)}
                      </p>
                    </div>
                    <div className="text-right text-xs font-semibold text-slate-200">
                      {available ? strings.readyLabel : strings.notReadyLabel}
                    </div>
                  </div>
                  {diagnostic.error && (
                    <p className="mt-1 text-[11px] text-rose-300">{diagnostic.error}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      )}
    </section>
  );
}
