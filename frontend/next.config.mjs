import localesConfig from './i18n/locales.config.json' assert { type: 'json' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  i18n: {
    locales: localesConfig.locales,
    defaultLocale: localesConfig.defaultLocale,
  },
};

export default nextConfig;
