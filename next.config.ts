// Assumptions: the OG route reads fonts from assets/fonts at runtime, so they are traced into the bundle.
// SENTRY_DSN is mirrored to NEXT_PUBLIC_SENTRY_DSN for the browser SDK. No basePath: if the church is served
// under sachapandit.com/church, set basePath: "/church" here and NEXT_PUBLIC_URL accordingly (see README).
// Not wrapped in withSentryConfig, so no source-map upload or auth token is needed to build.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["harfbuzzjs"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  },
  // Fonts only — do not force-trace harfbuzzjs wasm through pnpm symlinks (breaks Vercel packaging).
  outputFileTracingIncludes: {
    "/api/og/[id]": ["./assets/fonts/**/*"],
    "/api/og/certificate/[id]": ["./assets/fonts/**/*"],
    "/api/og/sermon/[userId]/[week]": ["./assets/fonts/**/*"],
    "/api/og/darshan/[id]": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
