/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from '@sentry/nextjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enhanced Vercel deployment configuration
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Enable static optimization
  output: 'standalone',
  // Compress output for better performance
  compress: true,
  // Enhanced image optimization
  images: {
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

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, configFile, stripPrefix, urlPrefix, include, ignore
  
  org: "broskis-kitcheb",
  project: "javascript-nextjs",
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,
  
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  
  // Enables automatic instrumentation of Vercel Cron Monitors.
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/instrumentation/automatic-instrumentation/
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
