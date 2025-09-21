import { LandingPage } from "@/components/landing/LandingPage";
import { hiCopy } from "@/i18n/content/hi";

export default function LandingPageRoute() {
  return <LandingPage copy={hiCopy} locale="hi" />;
}
