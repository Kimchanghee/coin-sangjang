"use client";

import { useMemo } from "react";

import { ResponsiveShell } from "@/components/layout/ResponsiveShell";
import { AdminRequestForm } from "@/components/forms/AdminRequestForm";
import { TradePreferencesForm } from "@/components/forms/TradePreferencesForm";
import { BannerSlot } from "./BannerSlot";
import { FeatureList } from "./FeatureList";
import { HeroSection } from "./HeroSection";
import { UsageGuideSection } from "./UsageGuideSection";
import { RealtimeFeedPanel } from "./RealtimeFeedPanel";
import { ApiKeysPanel } from "./ApiKeysPanel";
import { ListingSourcesPanel } from "./ListingSourcesPanel";
import { ExecutionReadinessPanel } from "./ExecutionReadinessPanel";
import { useListingStream } from "@/hooks/useListingStream";
import type { LandingCopy } from "@/i18n/content/types";
import type { Locale } from "@/i18n/locales";
import type { ListingEvent } from "@/types/listings";

const PRIMARY_LOCALES: Locale[] = ["ko", "en", "ja", "zh-cn", "vi"];

export interface LandingPageProps {
  copy: LandingCopy;
  locale: Locale;
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
        error: "Awaiting new listing window",
      },
    ],
  },
];

export function LandingPage({ copy, locale }: LandingPageProps) {
  const banner = (
    <BannerSlot title={copy.banner.title} subtitle={copy.banner.subtitle} cta={copy.banner.cta} />
  );

  const sidebar = (
    <div className="space-y-6">
      <AdminRequestForm copy={copy.admin} locale={locale} />
      <ApiKeysPanel copy={copy} />
    </div>
  );

  const apiBase = useMemo(() => {
    const envValue = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
    if (envValue && envValue.length > 0) {
      return envValue.replace(/\/$/, "");
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}/api`;
    }

    return "/api";
  }, []);

  const { events, connected, lastSyncedAt } = useListingStream(apiBase, {
    fallbackEvents: FALLBACK_EVENTS,
  });

  return (
    <ResponsiveShell
      banner={banner}
      sidebar={sidebar}
      locale={locale}
      switchableLocales={PRIMARY_LOCALES}
    >
      <HeroSection title={copy.heroTitle} subtitle={copy.heroSubtitle} ctaLabel={copy.ctaLabel} />
      <FeatureList title={copy.featuresTitle} items={copy.features} />
      <UsageGuideSection title={copy.usageGuideTitle} copy={copy.usageGuide} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ListingSourcesPanel
          copy={copy.collectors}
          events={events}
          connected={connected}
          locale={locale}
          lastSyncedAt={lastSyncedAt}
        />
        <ExecutionReadinessPanel copy={copy.executionPreview} apiBase={apiBase} events={events} />
      </div>
      <RealtimeFeedPanel copy={copy} locale={locale} events={events} connected={connected} />
      <TradePreferencesForm copy={copy.tradeForm} locale={locale} />
    </ResponsiveShell>
  );
}
