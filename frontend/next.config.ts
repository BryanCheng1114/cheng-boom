import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'zh', 'ms'],
    defaultLocale: 'en',
  },
};

export default nextConfig;
