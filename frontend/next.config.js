/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/recflix-production\.up\.railway\.app\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "tmdb-images",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-images",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
});

const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // recharts v3 uses ESM - transpile for Next.js compatibility
  transpilePackages: ["recharts"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24,
    deviceSizes: [640, 750, 1080],      // ✅ images 안으로
    imageSizes: [160, 200, 342],        // ✅ images 안으로
    formats: ["image/avif", "image/webp"], // ✅ images 안으로
  },

  compress: true,

  // Production optimizations
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
     ? { exclude: ["error"] }
     : false,
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Redirects and rewrites can be added here
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { 
            key: "Link", 
            value: "<https://image.tmdb.org>; rel=preconnect; crossorigin" 
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },  
};

const sentryWebpackPluginOptions = {
  // Suppress source map upload when no auth token is set
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "recflix-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Disable source map upload in CI if no token
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  // Avoid creating release if no auth token
  release: process.env.SENTRY_AUTH_TOKEN ? undefined : "skip",
};

module.exports = withSentryConfig(withPWA(nextConfig), sentryWebpackPluginOptions);
