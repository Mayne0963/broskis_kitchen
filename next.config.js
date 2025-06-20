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
  // Disable static export for pages that require runtime
  trailingSlash: false,
  output: 'export',
  distDir: 'out',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Webpack configuration to help prevent chunk loading errors
  webpack: (config, { dev, isServer }) => {
    // Optimize chunk splitting for better loading reliability
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Create a separate chunk for vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Create a separate chunk for common components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  // Optional: Disable granular chunks if needed (uncomment if issues persist)
  // experimental: {
  //   granularChunks: false,
  // },
  
  // Skip static generation for auth pages
  async generateBuildId() {
    return 'build-' + Date.now()
  }
}

export default nextConfig
