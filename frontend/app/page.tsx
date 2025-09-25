import { LandingPage } from "@/components/landing/LandingPage";
import { landingCopyMap } from "@/i18n/content";
import { defaultLocale } from "@/i18n/locales";

export default function IndexPage() {
  const copy = landingCopyMap[defaultLocale];

  return <LandingPage copy={copy} locale={defaultLocale} />;
}
