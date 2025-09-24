"use client";

import { useEffect, useMemo, useState } from "react";
import type { TradeFormCopy } from "@/i18n/content/types";

interface TradePreferencesFormProps {
  copy: TradeFormCopy;
  locale: string;
}

const exchanges = [
  "BINANCE",
  "BYBIT",
  "OKX",
  "GATEIO",
  "BITGET",
];

type TradePreferencesResponse = {
  exchanges?: string[];
  leverage?: number;
  amountUsdt?: number;
  takeProfitPercent?: number;
  stopLossPercent?: number;
  mode?: "TESTNET" | "MAINNET";
  autoTrade?: boolean;
};

export function TradePreferencesForm({ copy }: TradePreferencesFormProps) {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(exchanges);
  const [leverage, setLeverage] = useState(10);
  const [usdt, setUsdt] = useState(100);
  const [tp, setTp] = useState(15);
  const [sl, setSl] = useState(7);
  const [useTestnet, setUseTestnet] = useState(true);
  const [autoTrade, setAutoTrade] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api",
    [],
  );

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch(`${apiBase}/public/trade-preferences`);
        if (!response.ok) {
          throw new Error(`Failed to load preferences: ${response.status}`);
        }
        const data: TradePreferencesResponse = await response.json();
        if (data) {
          if (Array.isArray(data.exchanges) && data.exchanges.length > 0) {
            setSelectedExchanges(
              data.exchanges.map((item: string) => item.toUpperCase()),
            );
          }
          if (typeof data.leverage === "number") {
            setLeverage(data.leverage);
          }
          if (typeof data.amountUsdt === "number") {
            setUsdt(data.amountUsdt);
          }
          if (typeof data.takeProfitPercent === "number") {
            setTp(data.takeProfitPercent);
          }
          if (typeof data.stopLossPercent === "number") {
            setSl(data.stopLossPercent);
          }
          if (typeof data.mode === "string") {
            setUseTestnet(data.mode === "TESTNET");
          }
          if (typeof data.autoTrade === "boolean") {
            setAutoTrade(data.autoTrade);
          }
        }
      } catch (err) {
        console.warn("Failed to load trade preferences", err);
        setStatus("error");
        setError(copy.errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void loadPreferences();
  }, [apiBase, copy.errorMessage]);

  const toggleExchange = (symbol: string) => {
    setSelectedExchanges((prev) =>
      prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol],
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus("idle");
    setError(null);

    const payload = {
      exchanges: selectedExchanges,
      leverage,
      amountUsdt: usdt,
      takeProfitPercent: tp,
      stopLossPercent: sl,
      mode: useTestnet ? "TESTNET" : "MAINNET",
      autoTrade,
      entryType: "MARKET",
    };

    void (async () => {
      try {
        const response = await fetch(`${apiBase}/public/trade-preferences`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to save preferences: ${response.status}`);
        }

        setStatus("saved");
      } catch (err) {
        console.error("Failed to persist trade preferences", err);
        setStatus("error");
        setError(copy.errorMessage);
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl"
    >
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">{copy.sectionTitle}</h3>
        <p className="text-sm text-slate-300">{copy.leverageHelper}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">{copy.leverageLabel}</span>
          <input
            type="number"
            min={1}
            max={125}
            value={leverage}
            onChange={(event) => setLeverage(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            disabled={loading || saving}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">{copy.sizeLabel}</span>
          <input
            type="number"
            min={10}
            step={5}
            value={usdt}
            onChange={(event) => setUsdt(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            disabled={loading || saving}
          />
          <span className="text-xs text-slate-400">{copy.sizeHelper}</span>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">{copy.tpLabel}</span>
          <input
            type="number"
            min={1}
            max={200}
            value={tp}
            onChange={(event) => setTp(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            disabled={loading || saving}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">{copy.slLabel}</span>
          <input
            type="number"
            min={1}
            max={90}
            value={sl}
            onChange={(event) => setSl(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            disabled={loading || saving}
          />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{copy.exchangeSelector}</legend>
        <div className="flex flex-wrap gap-2">
          {exchanges.map((exchange) => {
            const active = selectedExchanges.includes(exchange);
            return (
              <button
                key={exchange}
                type="button"
                onClick={() => toggleExchange(exchange)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-sky-500 text-slate-950"
                    : "bg-slate-800/70 text-slate-100 hover:bg-slate-700"
                }`}
                disabled={loading || saving}
              >
                {exchange}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useTestnet}
            onChange={(event) => setUseTestnet(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950"
            disabled={loading || saving}
          />
          {copy.testnetToggle}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoTrade}
            onChange={(event) => setAutoTrade(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950"
            disabled={loading || saving}
          />
          {copy.autoTradeToggle}
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-sky-500 py-2 font-semibold text-slate-950 transition hover:bg-sky-400"
        disabled={loading || saving}
      >
        {saving ? `${copy.submitLabel}…` : copy.submitLabel}
      </button>
      {status === "saved" && (
        <p className="text-xs text-emerald-300">{copy.savedMessage}</p>
      )}
      {status === "error" && error && (
        <p className="text-xs text-rose-300">{error}</p>
      )}
    </form>
  );
}
