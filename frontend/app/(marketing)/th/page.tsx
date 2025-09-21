import { LandingPage } from "@/components/landing/LandingPage";
import { thCopy } from "@/i18n/content/th";

export default function LandingPageRoute() {
  return <LandingPage copy={thCopy} locale="th" />;
}
