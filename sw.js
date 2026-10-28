// Service Worker for Trade Show Demo

const CACHE_NAME = 'trade-show-demo-v6';
const OFFLINE_URL = '/index.html';

// Resources to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/attract.css',
  '/css/responsive.css',
  '/js/analytics.js',
  '/js/offline.js',
  '/js/attract-mode.js',
  '/js/menu-system.js',
  '/js/demo-launcher.js',
  '/js/lead-capture.js',
  '/js/app.js',
  '/data/demos.json',
  '/manifest.json',
  '/vendor/reveal/css/reveal.css',
  '/vendor/reveal/css/theme-packed-planet.css',
  '/vendor/reveal/js/reveal.js',
  '/slides/budgets.html',
  '/slides/contracts.html',
  '/slides/myqiosk-live.html',
  '/slides/revenue-pro.html',
  '/slides/noaweb.html',
  '/slides/full-service.html',
  '/slides/remote-mgmt.html',
  '/slides/noa-plus.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
];

// Optional resources - cache but don't fail if missing
const optionalUrls = [
  '/assets/images/tnc-logo.svg',
  '/assets/images/favicon.svg',
  '/assets/images/icon-192.svg',
  '/assets/images/icon-512.svg',
  '/assets/images/attract-poster.jpg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache required resources
        return cache.addAll(urlsToCache).then(() => {
          // Try to cache optional resources, but don't fail if missing
          return Promise.allSettled(
            optionalUrls.map(url => 
              cache.add(url).catch(err => 
                console.log('Optional resource not cached:', url)
              )
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://cdnjs.cloudflare.com') &&
      !event.request.url.startsWith('https://cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched resource
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Network failed, try to return offline page
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Background sync for analytics (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Sync stored analytics events when online
  try {
    const events = await getStoredEvents();
    if (events.length > 0) {
      // Send to analytics endpoint
      console.log('Syncing', events.length, 'analytics events');
    }
  } catch (error) {
    console.error('Failed to sync analytics:', error);
  }
}

function getStoredEvents() {
  return new Promise((resolve) => {
    // This would interact with IndexedDB in a real implementation
    resolve([]);
  });
}
