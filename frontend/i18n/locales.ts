export const locales = [
  'ko',
  'en',
  'ja',
  'zh-cn',
  'th',
  'vi',
  'es',
  'pt',
  'hi',
  'id',
  'de',
  'fr',
  'ru',
  'tr',
  'ar',
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export const localeLabels: Record<Locale, string> = {
  ko: 'ÇÑ±¹¾î',
  en: 'English',
  ja: 'ìíÜâåÞ',
  'zh-cn': '??ñéÙþ',
  th: '???',
  vi: 'Ti?ng Vi?t',
  es: 'Espanol',
  pt: 'Portugues',
  hi: '??????',
  id: 'Bahasa Indonesia',
  de: 'Deutsch',
  fr: 'Francais',
  ru: '¬²¬å¬ã¬ã¬Ü¬Ú¬Û',
  tr: 'Turkce',
  ar: '???????',
};
