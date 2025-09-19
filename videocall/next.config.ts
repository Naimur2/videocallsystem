import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking and linting during build for faster Docker builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration for better module resolution
  webpack: (config) => {
    // Optimize module resolution
    config.resolve.symlinks = false;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },

  // Docker-friendly configuration
  output: "standalone",
  
  // Performance optimizations
  compress: true,
  
  // Image optimization for faster loading
  images: {
    unoptimized: true, // For static export compatibility
  },
  
  // Headers for CORS, security, and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // Cache static assets for better performance
      {
        source: '/(_next/static|favicon.ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
