// @ts-check
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // In production, Caddy routes api.plexoapp.com directly to the API container.
    // This rewrite is only used in local dev (npm run dev).
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Source map upload is disabled — set SENTRY_AUTH_TOKEN to enable.
  silent: true,
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
});
