import type { NextConfig } from "next";

const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  ...(allowedDevOrigins?.length ? { allowedDevOrigins } : {}),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
