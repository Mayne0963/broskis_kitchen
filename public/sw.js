// Service Worker for chunk loading error recovery and offline support

const CACHE_NAME = 'broski-kitchen-v2';

// Basic cache of "/" and manifest
const STATIC_ASSETS = ['/', '/manifest.webmanifest'];
const STATIC_PATHS = new Set(STATIC_ASSETS);

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first for pages, skip non-GET requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    // If URL parsing fails, let the request continue without SW handling
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isFirestore = url.hostname.includes('firestore.googleapis.com');

  // Skip cross-origin requests (Firestore, Google APIs, Stripe, etc.)
  if (!isSameOrigin || isFirestore) return;

  // Only handle explicit static assets to avoid interfering with API routes
  if (!STATIC_PATHS.has(url.pathname)) return;

  // Network-first strategy for known static assets
  event.respondWith(networkFirst(request));
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}







console.log('Service Worker loaded successfully')
