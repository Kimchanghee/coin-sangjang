import { LandingPage } from "@/components/landing/LandingPage";
import { ptCopy } from "@/i18n/content/pt";

export default function LandingPageRoute() {
  return <LandingPage copy={ptCopy} locale="pt" />;
}
