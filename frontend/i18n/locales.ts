export const locales = [
  'ko',
  'en',
  'ja',
  'zh-cn',
  'vi',
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export const localeLabels: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-cn': '简体中文',
  vi: 'Tiếng Việt',
};
