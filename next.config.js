/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enhanced image optimization
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
  // Enhanced webpack configuration to prevent chunk loading errors
  webpack: (config, { dev, isServer }) => {
    // Optimize chunk splitting for better loading reliability
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Create a separate chunk for vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            // Create a separate chunk for common components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate chunk for layout components
            layout: {
              test: /[\\/]src[\\/](components[\\/]layout|app[\\/]layout)/,
              name: 'layout',
              chunks: 'all',
              priority: 8,
              enforce: true,
            },
          },
        },
        // Add module concatenation for better performance
        concatenateModules: true,
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
  // Experimental settings to improve build stability
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner'],
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
  
  // Skip static generation for auth pages
  async generateBuildId() {
    return 'build-' + Date.now()
  }
}

export default nextConfig
