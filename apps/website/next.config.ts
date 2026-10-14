import type { NextConfig } from 'next';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
