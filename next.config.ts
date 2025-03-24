import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    serverActions: {
      // Allow server actions from GitHub Codespaces domains
      allowedOrigins: ['localhost:3000', '.app.github.dev', 
        'https://build-your-own-bot.d619751979aaf828d617a645de8d8b1c.r2.cloudflarestorage.com','agentvendor.ca'],
    }
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: 'build-your-own-bot.d619751979aaf828d617a645de8d8b1c.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'agentvendor.ca',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Added the domain from the deprecated config
        hostname: 'pub-8ddd283c539f458b8f9ee190cb5cbbdd.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      }
    ],
  },
  // Add headers for CORS in GitHub Codespaces
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;