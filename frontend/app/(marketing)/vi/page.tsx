import { LandingPage } from "@/components/landing/LandingPage";
import { viCopy } from "@/i18n/content/vi";

export default function LandingPageRoute() {
  return <LandingPage copy={viCopy} locale="vi" />;
}
