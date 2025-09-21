import { LandingPage } from "@/components/landing/LandingPage";
import { zhCnCopy } from "@/i18n/content/zh-cn";

export default function LandingPageRoute() {
  return <LandingPage copy={zhCnCopy} locale="zh-cn" />;
}
