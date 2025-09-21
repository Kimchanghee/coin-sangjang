import { LandingPage } from "@/components/landing/LandingPage";
import { frCopy } from "@/i18n/content/fr";

export default function LandingPageRoute() {
  return <LandingPage copy={frCopy} locale="fr" />;
}
