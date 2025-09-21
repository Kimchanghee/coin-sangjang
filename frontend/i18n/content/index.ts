import { enCopy } from "./en";
import { koCopy } from "./ko";
import { jaCopy } from "./ja";
import { zhCnCopy } from "./zh-cn";
import { thCopy } from "./th";
import { viCopy } from "./vi";
import { esCopy } from "./es";
import { ptCopy } from "./pt";
import { hiCopy } from "./hi";
import { idCopy } from "./id";
import { deCopy } from "./de";
import { frCopy } from "./fr";
import { ruCopy } from "./ru";
import { trCopy } from "./tr";
import { arCopy } from "./ar";
import { LandingCopy } from "./types";

export const landingCopyMap: Record<string, LandingCopy> = {
  en: enCopy,
  ko: koCopy,
  ja: jaCopy,
  'zh-cn': zhCnCopy,
  th: thCopy,
  vi: viCopy,
  es: esCopy,
  pt: ptCopy,
  hi: hiCopy,
  id: idCopy,
  de: deCopy,
  fr: frCopy,
  ru: ruCopy,
  tr: trCopy,
  ar: arCopy,
};
