import { enCopy } from "./en";
import { koCopy } from "./ko";
import { jaCopy } from "./ja";
import { zhCnCopy } from "./zh-cn";
import { viCopy } from "./vi";
import { LandingCopy } from "./types";

export const landingCopyMap: Record<string, LandingCopy> = {
  en: enCopy,
  ko: koCopy,
  ja: jaCopy,
  'zh-cn': zhCnCopy,
  vi: viCopy,
};
