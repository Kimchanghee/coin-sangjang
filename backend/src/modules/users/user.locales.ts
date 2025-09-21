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
