import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  i18n: {
    locales: [...locales],
    defaultLocale,
  },
};

export default nextConfig;
