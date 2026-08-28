import type { NextConfig } from 'next';

// Derive the Strapi hostname from NEXT_PUBLIC_STRAPI_URL so it works in
// both local dev (localhost:1337) and production (Railway domain).
function getStrapiHostname(): string {
  const url = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}

const strapiHostname = getStrapiHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Strapi uploads — hostname resolved from env var
      {
        protocol: process.env.NEXT_PUBLIC_STRAPI_URL?.startsWith('https') ? 'https' : 'http',
        hostname: strapiHostname,
      },
      // External images (Unsplash, CDNs, etc.)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
