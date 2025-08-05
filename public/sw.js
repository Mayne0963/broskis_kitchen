// Service Worker for Push Notifications
// This file handles background push notifications and notification clicks

const CACHE_NAME = 'broskis-kitchen-v1';
const urlsToCache = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Broski\'s Kitchen',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { url: '/' }
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        image: payload.image,
        data: payload.data || notificationData.data,
        actions: payload.actions || [],
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [200, 100, 200],
        silent: payload.silent || false
      };
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  // Show the notification
  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      data: notificationData.data,
      actions: notificationData.actions,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      silent: notificationData.silent
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  // Get the notification data
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  // Determine the URL to open
  let urlToOpen = '/';
  
  if (action) {
    // Handle specific action clicks
    switch (action) {
      case 'view':
        urlToOpen = notificationData.url || `/orders/${notificationData.orderId}`;
        break;
      case 'track':
        urlToOpen = `/orders/${notificationData.orderId}/track`;
        break;
      case 'directions':
        urlToOpen = '/location';
        break;
      case 'rate':
        urlToOpen = `/orders/${notificationData.orderId}/rate`;
        break;
      case 'reorder':
        urlToOpen = `/reorder/${notificationData.orderId}`;
        break;
      default:
        urlToOpen = notificationData.url || '/';
    }
  } else {
    // Handle general notification click
    urlToOpen = notificationData.url || '/';
  }

  // Open the URL
  const urlOpenPromise = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if there's already a window/tab open with the target URL
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    
    // If no existing window/tab, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(urlOpenPromise);
});

// Background sync event - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncPendingOrders());
  }
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Fetch event - handle network requests (basic caching strategy)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Network first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return a custom offline response for API calls
          return new Response(
            JSON.stringify({ error: 'Offline', message: 'Please check your internet connection' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // Cache first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Helper function to sync pending orders
async function syncPendingOrders() {
  try {
    // Get pending orders from IndexedDB or localStorage
    const pendingOrders = await getPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        // Attempt to sync the order
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          // Remove from pending orders
          await removePendingOrder(order.id);
          
          // Show success notification
          self.registration.showNotification('Order Synced', {
            body: `Your order ${order.orderNumber} has been successfully placed!`,
            icon: '/icons/icon-192x192.png',
            tag: `order-sync-${order.id}`
          });
        }
      } catch (error) {
        console.error('Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('Error during background sync:', error);
  }
}

// Helper function to get pending orders (placeholder)
async function getPendingOrders() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

// Helper function to remove pending order (placeholder)
async function removePendingOrder(orderId) {
  // This would typically remove from IndexedDB
  console.log('Removing pending order:', orderId);
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
});