"use client";

import { useMemo, useState } from "react";
import type { AdminCopy } from "@/i18n/content/types";

const exchanges = [
  { value: "upbit", label: "Upbit" },
  { value: "bithumb", label: "Bithumb" },
  { value: "binance", label: "Binance" },
  { value: "bybit", label: "Bybit" },
  { value: "okx", label: "OKX" },
  { value: "gateio", label: "Gate.io" },
  { value: "bitget", label: "Bitget" },
];

interface AdminRequestFormProps {
  copy: AdminCopy;
  locale: string;
}

export function AdminRequestForm({ copy }: AdminRequestFormProps) {
  const [uid, setUid] = useState("");
  const [exchange, setExchange] = useState(exchanges[0]?.value ?? "");
  const [status, setStatus] = useState<"idle" | "submitted" | "error">("idle");
  const [saving, setSaving] = useState(false);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api",
    [],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus("idle");
    void (async () => {
      try {
        const response = await fetch(`${apiBase}/admin/portal/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, exchange: exchange.toUpperCase() }),
        });
        if (!response.ok) {
          throw new Error(`Failed to submit request: ${response.status}`);
        }
        setStatus("submitted");
      } catch (error) {
        console.error("[admin-request] submission failed", error);
        setStatus("error");
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
        <h3 className="text-lg font-semibold">{copy.requestTitle}</h3>
        <p className="text-sm text-slate-300">{copy.requestDescription}</p>
      </header>
      <label className="space-y-2 text-sm">
        <span className="font-medium">{copy.uidLabel}</span>
        <input
          required
          value={uid}
          onChange={(event) => setUid(event.target.value)}
          placeholder="0000-0000"
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          disabled={saving}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">{copy.exchangeLabel}</span>
        <select
          value={exchange}
          onChange={(event) => setExchange(event.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          disabled={saving}
        >
          {exchanges.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-slate-400">{copy.note}</p>
      <button
        type="submit"
        className="w-full rounded-md bg-emerald-500 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400"
        disabled={saving}
      >
        {saving ? `${copy.submit}…` : copy.submit}
      </button>
      {status === "submitted" && (
        <p className="text-xs text-emerald-300">{copy.successNotice}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-rose-300">{copy.errorNotice}</p>
      )}
    </form>
  );
}
