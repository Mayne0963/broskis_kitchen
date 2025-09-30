// Service Worker for chunk loading error recovery and offline support

const CACHE_NAME = 'broski-kitchen-v1'
const STATIC_CACHE_NAME = 'broski-kitchen-static-v1'
const DYNAMIC_CACHE_NAME = 'broski-kitchen-dynamic-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html', // Fallback page
]

// Network-first strategy for API calls (excluding auth routes)
const API_ROUTES = [
  '/api/',
]

// Routes to exclude from service worker caching
const EXCLUDED_ROUTES = [
  '/api/auth/',
  '/auth/',
]

// Cache-first strategy for static assets
const STATIC_ROUTES = [
  '/_next/static/',
  '/images/',
  '/icons/',
  '.js',
  '.css',
  '.woff2',
  '.woff',
  '.ttf',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS.filter(url => url !== '/offline.html'))
      }),
      // Create offline fallback
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.add('/offline.html')
      })
    ]).then(() => {
      console.log('Service Worker installed successfully')
      // Force activation
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully')
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Skip excluded routes (auth routes)
  if (isExcludedRoute(request)) {
    return
  }
  
  // Handle different types of requests
  if (isAPIRequest(request)) {
    // Network-first for API calls
    event.respondWith(networkFirstStrategy(request))
  } else if (isStaticAsset(request)) {
    // Cache-first for static assets
    event.respondWith(cacheFirstStrategy(request))
  } else if (isNavigationRequest(request)) {
    // Network-first with offline fallback for navigation
    event.respondWith(navigationStrategy(request))
  } else {
    // Default: network-first
    event.respondWith(networkFirstStrategy(request))
  }
})

// Strategy: Network-first with cache fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // If it's a chunk loading error, try to recover
    if (isChunkRequest(request)) {
      return handleChunkLoadError(request)
    }
    
    throw error
  }
}

// Strategy: Cache-first with network fallback
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request)
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url, error)
    throw error
  }
}

// Strategy: Navigation with offline fallback
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Navigation failed, trying cache:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page as fallback
    const offlineResponse = await caches.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    throw error
  }
}

// Handle chunk loading errors specifically
async function handleChunkLoadError(request) {
  console.log('Handling chunk load error for:', request.url)
  
  // Try to find a cached version
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    console.log('Found cached chunk:', request.url)
    return cachedResponse
  }
  
  // If no cached version, try to fetch with retry
  for (let i = 0; i < 3; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      const response = await fetch(request)
      
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE_NAME)
        cache.put(request, response.clone())
        return response
      }
    } catch (error) {
      console.log(`Chunk retry ${i + 1} failed:`, error)
    }
  }
  
  // If all retries fail, return a custom error response
  return new Response(
    'console.error("Chunk loading failed. Please refresh the page."); window.location.reload();',
    {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/javascript',
      },
    }
  )
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      await cache.put(request, networkResponse)
    }
  } catch (error) {
    // Silently fail background updates
    console.log('Background cache update failed:', error)
  }
}

// Helper functions
function isAPIRequest(request) {
  return API_ROUTES.some(route => request.url.includes(route))
}

function isExcludedRoute(request) {
  return EXCLUDED_ROUTES.some(route => request.url.includes(route))
}

function isStaticAsset(request) {
  return STATIC_ROUTES.some(route => request.url.includes(route))
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

function isChunkRequest(request) {
  return (
    request.url.includes('/_next/static/chunks/') ||
    request.url.includes('.js') ||
    request.url.includes('.css')
  )
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status)
      })
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

// Cache management functions
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  console.log('All caches cleared')
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  await cache.addAll(urls)
  console.log('URLs cached:', urls)
}

async function getCacheStatus() {
  const cacheNames = await caches.keys()
  const status = {}
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    status[name] = keys.length
  }
  
  return status
}

console.log('Service Worker loaded successfully')