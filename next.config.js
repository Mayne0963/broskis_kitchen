/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Use standalone output for better API route support (production only)
  trailingSlash: false,
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
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
    
    return config;
  },
  // Experimental settings to improve build stability
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Skip static generation for auth pages
  async generateBuildId() {
    return 'build-' + Date.now()
  }
}

export default nextConfig
