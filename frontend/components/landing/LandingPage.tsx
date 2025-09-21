import { ResponsiveShell } from "@/components/layout/ResponsiveShell";
import { AdminRequestForm } from "@/components/forms/AdminRequestForm";
import { TradePreferencesForm } from "@/components/forms/TradePreferencesForm";
import { BannerSlot } from "./BannerSlot";
import { FeatureList } from "./FeatureList";
import { HeroSection } from "./HeroSection";
import { UsageGuideSection } from "./UsageGuideSection";
import { RealtimeFeedPanel } from "./RealtimeFeedPanel";
import { ApiKeysPanel } from "./ApiKeysPanel";
import type { LandingCopy } from "@/i18n/content/types";

interface LandingPageProps {
  copy: LandingCopy;
  locale: string;
}

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

  return (
    <ResponsiveShell banner={banner} sidebar={sidebar}>
      <HeroSection title={copy.heroTitle} subtitle={copy.heroSubtitle} ctaLabel={copy.ctaLabel} />
      <FeatureList title={copy.featuresTitle} items={copy.features} />
      <UsageGuideSection title={copy.usageGuideTitle} copy={copy.usageGuide} />
      <RealtimeFeedPanel copy={copy} locale={locale} />
      <TradePreferencesForm copy={copy.tradeForm} locale={locale} />
    </ResponsiveShell>
  );
}
