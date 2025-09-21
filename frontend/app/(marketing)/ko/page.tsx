import { LandingPage } from "@/components/landing/LandingPage";
import { koCopy } from "@/i18n/content/ko";

export default function LandingPageRoute() {
  return <LandingPage copy={koCopy} locale="ko" />;
}
