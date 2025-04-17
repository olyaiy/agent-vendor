import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // compiler: {
  //   removeConsole: true,
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev', // Changed to wildcard to cover all R2 subdomains
        pathname: '/agents/**',
      },
      // Add other hostnames here if needed, e.g., for user avatars from Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

};

export default nextConfig;
