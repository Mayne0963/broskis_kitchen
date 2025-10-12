/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build-time environment validation
const required = ["NEXTAUTH_SECRET","NEXTAUTH_URL","ALLOWED_ADMIN_EMAILS"];
required.forEach(k => {
  if (!process.env[k]) {
    throw new Error(`[Build] Missing required env: ${k}`);
  }
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enhanced Vercel deployment configuration
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Remove standalone output for Vercel deployment
  // output: 'standalone',
  // Compress output for better performance
  compress: true,
  // Enhanced image optimization
  images: {
    unoptimized: true,
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Loader configuration for better performance
    loader: 'default',
    path: '/_next/image',
  },
  // Enhanced configuration for Vercel deployment
  trailingSlash: false,
  // Enable static file serving optimization
  generateEtags: true,
  // Optimize for Vercel's edge network
  poweredByHeader: false,
  // Simplified webpack configuration to prevent chunk loading errors
  webpack: (config, { dev, isServer }) => {
    // Simplified chunk splitting for better reliability
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 500000, // Increased max size to reduce chunk fragmentation
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Simplified vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    
    // Add resolve fallbacks for better compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Add webpack alias for @ pointing to src/
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    
    return config;
  },
  // External packages for server components
  serverExternalPackages: ['firebase-admin'],
  
  // Minimal experimental settings for stability
  experimental: {
    // Remove package optimizations that might cause issues
    // optimizePackageImports: ['lucide-react', 'sonner'],
    optimizeCss: false,
  },
  
  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Enhanced build ID generation for cache busting
  async generateBuildId() {
    // Use environment-specific build ID for better cache management
    const timestamp = Date.now()
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    return `${env}-${timestamp}`
  },
  
  // Enhanced headers for better caching and security
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  }
}

export default nextConfig;
