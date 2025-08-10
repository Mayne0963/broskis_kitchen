# ChunkLoadError Prevention Guide

This guide provides comprehensive solutions for preventing and handling ChunkLoadError in Next.js applications.

## What is ChunkLoadError?

ChunkLoadError occurs when the browser fails to load JavaScript chunks that are dynamically imported. This typically happens when:
- Network connectivity issues
- Cached files become stale after deployment
- CDN or server issues
- Browser cache conflicts
- Webpack chunk splitting issues

## Solutions Implemented

### 1. Error Boundary with Chunk Error Detection

**File:** `src/components/common/ErrorBoundary.tsx`

- Catches ChunkLoadError and other runtime errors
- Provides user-friendly error messages
- Offers retry and reload options
- Automatically detects chunk loading errors

### 2. Dynamic Import Retry Utility

**File:** `src/lib/utils/dynamicImportRetry.ts`

- Implements retry logic for dynamic imports
- Exponential backoff for failed imports
- Global chunk error handler setup
- Preloading capabilities

**Usage Example:**
```typescript
import { dynamicImportWithRetry } from '@/lib/utils/dynamicImportRetry';

// Basic usage with retry
const loadModule = async () => {
  try {
    const module = await dynamicImportWithRetry(
      () => import('./MyComponent'),
      { maxRetries: 3, delay: 1000 }
    );
    return module;
  } catch (error) {
    console.error('Failed to load module:', error);
  }
};

// Create a reusable retry import
import { createRetryImport } from '@/lib/utils/dynamicImportRetry';

const retryImport = createRetryImport('./MyComponent', {
  maxRetries: 3,
  delay: 1000,
  backoff: true
});
```

### 3. Global Chunk Error Handler

**File:** `src/components/common/ChunkErrorHandler.tsx`

- Sets up global error listeners
- Automatically handles unhandled chunk errors
- Provides user prompts for page reload

### 4. Webpack Optimization

**File:** `next.config.js`

- Optimized chunk splitting strategy
- Separate vendor and common chunks
- Improved caching and loading reliability

## Deployment Checklist

### Pre-Deployment

- [ ] Clear build cache: `rm -rf .next`
- [ ] Fresh dependency install: `rm -rf node_modules && npm install`
- [ ] Run production build: `npm run build`
- [ ] Test build locally: `npm start`
- [ ] Verify all routes load correctly
- [ ] Test dynamic imports functionality

### Deployment Configuration

#### Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

#### Netlify
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
```

#### Docker
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

### Post-Deployment Verification

- [ ] Verify all static assets are accessible
- [ ] Test dynamic routes and imports
- [ ] Check browser developer tools for 404 errors
- [ ] Test on different browsers and devices
- [ ] Monitor error logs for chunk loading issues

## Browser Cache Management

### Clear Browser Cache
```javascript
// Add to your app for development
if (process.env.NODE_ENV === 'development') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
}
```

### Cache Headers (for custom server)
```javascript
// Express.js example
app.use('/_next/static', express.static('.next/static', {
  maxAge: '1y',
  immutable: true
}));

app.use('/static', express.static('public/static', {
  maxAge: '1y',
  immutable: true
}));
```

## Advanced Configuration Options

### Disable Granular Chunks (if issues persist)

Uncomment in `next.config.js`:
```javascript
experimental: {
  granularChunks: false,
}
```

### Custom Webpack Configuration
```javascript
webpack: (config, { dev, isServer }) => {
  if (!dev && !isServer) {
    // Disable chunk splitting for critical issues
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Single chunk strategy
        bundle: {
          name: 'bundle',
          chunks: 'all',
          enforce: true
        }
      }
    };
  }
  return config;
}
```

## Monitoring and Debugging

### Error Tracking
```javascript
// Add to your error tracking service
if (error.name === 'ChunkLoadError') {
  // Track chunk loading errors
  analytics.track('chunk_load_error', {
    error: error.message,
    url: window.location.href,
    userAgent: navigator.userAgent
  });
}
```

### Performance Monitoring
```javascript
// Monitor chunk loading performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('chunk')) {
      console.log('Chunk load time:', entry.duration);
    }
  });
});
observer.observe({ entryTypes: ['navigation', 'resource'] });
```

## Troubleshooting Common Issues

### Issue: Chunks fail to load after deployment
**Solution:** Clear CDN cache and browser cache

### Issue: Intermittent chunk loading failures
**Solution:** Implement retry logic and error boundaries

### Issue: Large bundle sizes causing timeouts
**Solution:** Optimize chunk splitting and implement lazy loading

### Issue: Service worker conflicts
**Solution:** Update service worker to handle new chunks

## Testing Chunk Loading

### Manual Testing
1. Build and deploy the application
2. Open browser developer tools
3. Go to Network tab and enable "Disable cache"
4. Navigate through the application
5. Check for any failed chunk requests

### Automated Testing
```javascript
// Cypress test example
cy.intercept('GET', '/_next/static/chunks/**', { forceNetworkError: true }).as('chunkError');
cy.visit('/page-with-dynamic-import');
cy.wait('@chunkError');
cy.contains('Something went wrong').should('be.visible');
```

## Best Practices

1. **Always use Error Boundaries** around dynamic imports
2. **Implement retry logic** for critical dynamic imports
3. **Monitor chunk loading errors** in production
4. **Test thoroughly** after each deployment
5. **Keep chunks reasonably sized** (< 250KB recommended)
6. **Use proper caching strategies** for static assets
7. **Implement graceful fallbacks** for failed imports

By following this guide, you should significantly reduce ChunkLoadError occurrences in your Next.js application.