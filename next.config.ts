import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
