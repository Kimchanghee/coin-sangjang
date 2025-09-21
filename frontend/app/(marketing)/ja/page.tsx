import { LandingPage } from "@/components/landing/LandingPage";
import { jaCopy } from "@/i18n/content/ja";

export default function LandingPageRoute() {
  return <LandingPage copy={jaCopy} locale="ja" />;
}
