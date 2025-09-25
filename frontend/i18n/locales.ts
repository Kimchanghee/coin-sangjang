import localesConfig from './locales.config.json';

const config = localesConfig as unknown as {
  locales: readonly ['ko', 'en', 'ja', 'zh-cn', 'vi'];
  defaultLocale: 'ko';
};

export const locales = config.locales;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = config.defaultLocale;

export const localeLabels: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-cn': '简体中文',
  vi: 'Tiếng Việt',
};
