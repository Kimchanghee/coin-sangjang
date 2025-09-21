"use client";

import { useState } from "react";
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

export function TradePreferencesForm({ copy, locale }: TradePreferencesFormProps) {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(exchanges);
  const [leverage, setLeverage] = useState(10);
  const [usdt, setUsdt] = useState(100);
  const [tp, setTp] = useState(15);
  const [sl, setSl] = useState(7);
  const [useTestnet, setUseTestnet] = useState(true);
  const [autoTrade, setAutoTrade] = useState(true);

  const toggleExchange = (symbol: string) => {
    setSelectedExchanges((prev) =>
      prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [...prev, symbol],
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.info("[trade-preferences]", {
      locale,
      leverage,
      usdt,
      tp,
      sl,
      selectedExchanges,
      useTestnet,
      autoTrade,
    });
    alert("Preferences saved locally. Connect backend API to persist.");
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
          />
          {copy.testnetToggle}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoTrade}
            onChange={(event) => setAutoTrade(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950"
          />
          {copy.autoTradeToggle}
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-sky-500 py-2 font-semibold text-slate-950 transition hover:bg-sky-400"
      >
        {copy.submitLabel}
      </button>
    </form>
  );
}
