import { LandingPage } from "@/components/landing/LandingPage";
import { trCopy } from "@/i18n/content/tr";

export default function LandingPageRoute() {
  return <LandingPage copy={trCopy} locale="tr" />;
}
