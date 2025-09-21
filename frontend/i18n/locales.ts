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
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-cn': '简体中文',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  es: 'Español',
  pt: 'Português',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  de: 'Deutsch',
  fr: 'Français',
  ru: 'Русский',
  tr: 'Türkçe',
  ar: 'العربية',
};
