import { LandingPage } from "@/components/landing/LandingPage";
import { deCopy } from "@/i18n/content/de";

export default function LandingPageRoute() {
  return <LandingPage copy={deCopy} locale="de" />;
}
