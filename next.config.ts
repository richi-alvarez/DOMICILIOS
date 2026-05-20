import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
    turbopack: false,
  },
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    // Mark ioredis as external (don't bundle with client code)
    if (!isServer) {
      config.externals.push({
        'ioredis': 'ioredis',
        'redis': 'redis',
      })
    }
    return config
  },
}

export default nextConfig
