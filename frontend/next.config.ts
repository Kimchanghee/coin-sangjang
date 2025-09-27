import type { NextConfig } from "next";

import { defaultLocale, locales } from "./i18n/locales";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  i18n: {
    locales: [...locales],
    defaultLocale,
  },
};

export default nextConfig;
