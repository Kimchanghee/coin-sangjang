import type { LandingCopy } from "@/i18n/content/types";

interface ApiKeysPanelProps {
  copy: LandingCopy;
}

export function ApiKeysPanel({ copy }: ApiKeysPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header>
        <h3 className="text-lg font-semibold">{copy.apiKeysTitle}</h3>
        <p className="text-sm text-slate-300">{copy.apiKeysHelper}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {["Binance", "Bybit", "OKX", "Gate.io", "Bitget"].map((exchange) => (
          <article key={exchange} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-sm font-semibold">{exchange}</h4>
            <p className="mt-2 text-xs text-slate-400">
              Mainnet/Testnet ¡¤ Status: <span className="text-emerald-400">Not Connected</span>
            </p>
            <button className="mt-3 w-full rounded-md bg-slate-800 py-2 text-sm font-medium hover:bg-slate-700">
              Manage Keys
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
