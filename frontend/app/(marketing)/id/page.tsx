import { LandingPage } from "@/components/landing/LandingPage";
import { idCopy } from "@/i18n/content/id";

export default function LandingPageRoute() {
  return <LandingPage copy={idCopy} locale="id" />;
}
