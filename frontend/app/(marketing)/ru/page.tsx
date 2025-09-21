import { LandingPage } from "@/components/landing/LandingPage";
import { ruCopy } from "@/i18n/content/ru";

export default function LandingPageRoute() {
  return <LandingPage copy={ruCopy} locale="ru" />;
}
