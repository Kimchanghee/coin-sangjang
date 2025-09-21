import { LandingPage } from "@/components/landing/LandingPage";
import { esCopy } from "@/i18n/content/es";

export default function LandingPageRoute() {
  return <LandingPage copy={esCopy} locale="es" />;
}
