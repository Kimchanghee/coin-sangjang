"use client";

import { useMemo, useState } from "react";
import type { LandingCopy } from "@/i18n/content/types";

interface ApiKeysPanelProps {
  copy: LandingCopy;
}

type ExchangeSlug = "BINANCE" | "BYBIT" | "OKX" | "GATEIO" | "BITGET";

type NetworkMode = "MAINNET" | "TESTNET";

interface ExchangeVerification {
  connected: boolean;
  lastCheckedAt: string;
  balances: Array<{
    type: "SPOT" | "FUTURES" | "MARGIN";
    asset: string;
    total: number;
    available: number;
  }>;
}

interface ExchangeFormState {
  apiKeyId: string;
  apiKeySecret: string;
  passphrase: string;
  mode: NetworkMode;
  loading: boolean;
  error?: string;
  verification?: ExchangeVerification;
}

const EXCHANGES: Array<{ slug: ExchangeSlug; label: string; requiresPassphrase?: boolean }> = [
  { slug: "BINANCE", label: "Binance" },
  { slug: "BYBIT", label: "Bybit" },
  { slug: "OKX", label: "OKX", requiresPassphrase: true },
  { slug: "GATEIO", label: "Gate.io", requiresPassphrase: true },
  { slug: "BITGET", label: "Bitget" },
];

const DEFAULT_COPY = {
  keyIdLabel: "API Key ID",
  secretLabel: "API Secret",
  passphraseLabel: "Passphrase (if required)",
  networkLabel: "Network",
  mainnetOption: "Mainnet",
  testnetOption: "Testnet",
  manageLabel: "Reset Form",
  verifyLabel: "Verify & Fetch Balances",
  verifyingLabel: "Verifying…",
  statusConnected: "Connected",
  statusDisconnected: "Not connected",
  lastCheckedLabel: "Last checked",
  balancesTitle: "Balances",
  futuresLabel: "Futures",
  spotLabel: "Spot",
  marginLabel: "Margin",
  emptyBalances: "No balances returned by the exchange.",
  connectionError: "Verification failed. Check the credentials and try again.",
  totalLabel: "Total",
  availableLabel: "Available",
};

export function ApiKeysPanel({ copy }: ApiKeysPanelProps) {
  const apiCopy = copy.apiKeysForm ?? DEFAULT_COPY;
  const [forms, setForms] = useState<Record<ExchangeSlug, ExchangeFormState>>(() => {
    const base: Record<ExchangeSlug, ExchangeFormState> = {
      BINANCE: {
        apiKeyId: "",
        apiKeySecret: "",
        passphrase: "",
        mode: "TESTNET",
        loading: false,
      },
      BYBIT: {
        apiKeyId: "",
        apiKeySecret: "",
        passphrase: "",
        mode: "TESTNET",
        loading: false,
      },
      OKX: {
        apiKeyId: "",
        apiKeySecret: "",
        passphrase: "",
        mode: "TESTNET",
        loading: false,
      },
      GATEIO: {
        apiKeyId: "",
        apiKeySecret: "",
        passphrase: "",
        mode: "TESTNET",
        loading: false,
      },
      BITGET: {
        apiKeyId: "",
        apiKeySecret: "",
        passphrase: "",
        mode: "TESTNET",
        loading: false,
      },
    };
    return base;
  });

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api",
    [],
  );

  const handleFieldChange = (
    exchange: ExchangeSlug,
    field: keyof Pick<ExchangeFormState, "apiKeyId" | "apiKeySecret" | "passphrase">,
    value: string,
  ) => {
    setForms((prev) => ({
      ...prev,
      [exchange]: {
        ...prev[exchange],
        [field]: value,
        error: undefined,
      },
    }));
  };

  const handleModeChange = (exchange: ExchangeSlug, mode: NetworkMode) => {
    setForms((prev) => ({
      ...prev,
      [exchange]: {
        ...prev[exchange],
        mode,
      },
    }));
  };

  const handleReset = (exchange: ExchangeSlug) => {
    setForms((prev) => ({
      ...prev,
      [exchange]: {
        apiKeyId: "",
        apiKeySecret: "",
        passphrase: "",
        mode: prev[exchange].mode,
        loading: false,
        verification: undefined,
        error: undefined,
      },
    }));
  };

  const handleVerify = async (exchange: ExchangeSlug) => {
    const form = forms[exchange];
    if (!form.apiKeyId || !form.apiKeySecret) {
      setForms((prev) => ({
        ...prev,
        [exchange]: { ...prev[exchange], error: apiCopy.connectionError },
      }));
      return;
    }

    setForms((prev) => ({
      ...prev,
      [exchange]: { ...prev[exchange], loading: true, error: undefined },
    }));

    try {
      const response = await fetch(`${apiBase}/public/exchanges/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange,
          apiKeyId: form.apiKeyId,
          apiKeySecret: form.apiKeySecret,
          passphrase: form.passphrase ? form.passphrase : undefined,
          mode: form.mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`verify failed with status ${response.status}`);
      }

      const data = (await response.json()) as ExchangeVerification & {
        fingerprint?: string;
        error?: string;
      };

      setForms((prev) => ({
        ...prev,
        [exchange]: {
          ...prev[exchange],
          loading: false,
          error: data.connected ? undefined : data.error ?? apiCopy.connectionError,
          verification: {
            connected: data.connected,
            lastCheckedAt: data.lastCheckedAt,
            balances: data.balances ?? [],
          },
        },
      }));
    } catch (error) {
      console.warn("failed to verify exchange credentials", error);
      setForms((prev) => ({
        ...prev,
        [exchange]: {
          ...prev[exchange],
          loading: false,
          error: apiCopy.connectionError,
        },
      }));
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header>
        <h3 className="text-lg font-semibold">{copy.apiKeysTitle}</h3>
        <p className="text-sm text-slate-300">{copy.apiKeysHelper}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {EXCHANGES.map(({ slug, label, requiresPassphrase }) => {
          const form = forms[slug];
          const verification = form.verification;
          const connected = verification?.connected ?? false;
          return (
            <article
              key={slug}
              className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4"
            >
              <header className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{label}</h4>
                <span
                  className={`text-xs font-semibold ${
                    connected ? "text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {connected ? apiCopy.statusConnected : apiCopy.statusDisconnected}
                </span>
              </header>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-200">
                  {apiCopy.keyIdLabel}
                  <input
                    value={form.apiKeyId}
                    onChange={(event) => handleFieldChange(slug, "apiKeyId", event.target.value)}
                    placeholder="xxxxxx"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-200">
                  {apiCopy.secretLabel}
                  <input
                    type="password"
                    value={form.apiKeySecret}
                    onChange={(event) =>
                      handleFieldChange(slug, "apiKeySecret", event.target.value)
                    }
                    placeholder="••••••"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </label>
                {requiresPassphrase && (
                  <label className="block text-xs font-medium text-slate-200">
                    {apiCopy.passphraseLabel}
                    <input
                      type="password"
                      value={form.passphrase}
                      onChange={(event) =>
                        handleFieldChange(slug, "passphrase", event.target.value)
                      }
                      placeholder="••••••"
                      className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </label>
                )}
                <label className="block text-xs font-medium text-slate-200">
                  {apiCopy.networkLabel}
                  <select
                    value={form.mode}
                    onChange={(event) =>
                      handleModeChange(slug, event.target.value as NetworkMode)
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="MAINNET">{apiCopy.mainnetOption}</option>
                    <option value="TESTNET">{apiCopy.testnetOption}</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleReset(slug)}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  {apiCopy.manageLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(slug)}
                  disabled={form.loading}
                  className="flex-1 rounded-md bg-sky-500 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {form.loading ? apiCopy.verifyingLabel : apiCopy.verifyLabel}
                </button>
              </div>
              {form.error && <p className="text-xs text-rose-400">{form.error}</p>}
              {verification && (
                <div className="space-y-2 rounded-md border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-xs font-semibold text-slate-200">
                    {apiCopy.balancesTitle}
                  </p>
                  {verification.balances.length === 0 ? (
                    <p className="text-xs text-slate-400">{apiCopy.emptyBalances}</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-slate-200">
                      {verification.balances.map((balance) => {
                        const typeLabel = (() => {
                          switch (balance.type) {
                            case "FUTURES":
                              return apiCopy.futuresLabel;
                            case "MARGIN":
                              return apiCopy.marginLabel;
                            default:
                              return apiCopy.spotLabel;
                          }
                        })();
                        return (
                          <li key={`${slug}-${balance.type}`} className="flex justify-between gap-4">
                            <span className="text-slate-300">{typeLabel}</span>
                            <span className="text-right text-slate-100">
                              {apiCopy.totalLabel}: {balance.total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {balance.asset}
                              <br />
                              <span className="text-slate-400">
                                {apiCopy.availableLabel}: {balance.available.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {balance.asset}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {apiCopy.lastCheckedLabel}: {" "}
                    {new Date(verification.lastCheckedAt).toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
