import { LandingPage } from "@/components/landing/LandingPage";
import { enCopy } from "@/i18n/content/en";

export default function LandingPageRoute() {
  return <LandingPage copy={enCopy} locale="en" />;
}
