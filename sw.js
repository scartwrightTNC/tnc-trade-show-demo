// Service Worker for Trade Show Demo

const CACHE_NAME = 'trade-show-demo-v12';
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
  '/slides/customer-xp.html',
  '/slides/revenue-pro.html',
  '/slides/noaweb.html',
  '/slides/full-service.html',
  '/slides/remote-mgmt.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
];

// Optional resources - cache but don't fail if missing
const optionalUrls = [
  '/assets/images/tnc-logo.svg',
  '/assets/images/favicon.svg',
  '/assets/images/icon-192.svg',
  '/assets/images/icon-512.svg',
  '/assets/images/attract-poster.jpg',
  // 30MB attract loop — precached when present so the attract screen plays
  // offline at the show; optional so a missing file can't break install.
  '/assets/video/attract-loop.mp4',
  // Slide deck imagery - precached so presentations render offline.
  '/slides/img/customerxp/s01-0.png',
  '/slides/img/customerxp/s01-1.png',
  '/slides/img/customerxp/s01-2.png',
  '/slides/img/customerxp/s02-0.png',
  '/slides/img/customerxp/s02-1.jpg',
  '/slides/img/customerxp/s03-0.png',
  '/slides/img/customerxp/s03-1.png',
  '/slides/img/customerxp/s04-0.png',
  '/slides/img/customerxp/s04-1.png',
  '/slides/img/customerxp/s04-2.png',
  '/slides/img/customerxp/s05-0.png',
  '/slides/img/customerxp/s05-1.png',
  '/slides/img/customerxp/s05-2.png',
  '/slides/img/customerxp/s05-3.png',
  '/slides/img/customerxp/s06-0.png',
  '/slides/img/customerxp/s06-1.png',
  '/slides/img/customerxp/s07-0.png',
  '/slides/img/customerxp/s07-1.png',
  '/slides/img/noaweb/s01-0.png',
  '/slides/img/noaweb/s02-0.png',
  '/slides/img/noaweb/s05-0.png',
  '/slides/img/noaweb/s05-1.png',
  '/slides/img/noaweb/s06-0.png',
  '/slides/img/noaweb/s07-0.png',
  '/slides/img/noaweb/s07-1.png',
  '/slides/img/noaweb/s08-0.jpg',
  '/slides/img/noaweb/s09-0.png',
  '/slides/img/remotemanagement/s01-0.png',
  '/slides/img/remotemanagement/s02-0.png',
  '/slides/img/remotemanagement/s02-1.png',
  '/slides/img/remotemanagement/s02-2.jpg',
  '/slides/img/remotemanagement/s03-0.png',
  '/slides/img/remotemanagement/s03-1.png',
  '/slides/img/remotemanagement/s03-2.png',
  '/slides/img/remotemanagement/s03-3.png',
  '/slides/img/remotemanagement/s03-4.png',
  '/slides/img/remotemanagement/s04-0.jpg',
  '/slides/img/remotemanagement/s04-1.png',
  '/slides/img/remotemanagement/s05-0.png',
  '/slides/img/remotemanagement/s06-0.png',
  '/slides/img/remotemanagement/s07-0.png',
  '/slides/img/remotemanagement/s08-0.jpg',
  '/slides/img/remotemanagement/s08-1.png',
  '/slides/img/remotemanagement/s10-0.png',
  '/slides/img/remotemanagement/s10-1.png',
  '/slides/img/remotemanagement/s10-2.png',
  '/slides/img/remotemanagement/s11-0.png',
  '/slides/img/remotemanagement/s11-1.png',
  '/slides/img/remotemanagement/s12-0.png',
  '/slides/img/remotemanagement/s12-1.png',
  '/slides/img/remotemanagement/s13-0.png',
  '/slides/img/remotemanagement/s13-1.png',
  '/slides/img/remotemanagement/s13-2.png',
  '/slides/img/remotemanagement/s14-0.png',
  '/slides/img/remotemanagement/s14-1.png',
  '/slides/img/remotemanagement/s15-0.png',
  '/slides/img/remotemanagement/s15-1.png',
  '/slides/img/remotemanagement/s15-2.png',
  '/slides/img/remotemanagement/s16-0.png',
  '/slides/img/remotemanagement/s17-0.png',
  '/slides/img/remotemanagement/s18-0.png',
  '/slides/img/remotemanagement/s18-1.png',
  '/slides/img/remotemanagement/s18-2.png',
  '/slides/img/revpro/s01-0.png',
  '/slides/img/revpro/s01-1.png',
  '/slides/img/revpro/s02-0.jpg',
  '/slides/img/revpro/s02-1.png',
  '/slides/img/revpro/s02-2.png',
  '/slides/img/revpro/s02-3.png',
  '/slides/img/revpro/s04-0.png',
  '/slides/img/revpro/s05-0.png',
  '/slides/img/revpro/s06-0.png',
  '/slides/img/revpro/s06-1.png',
  '/slides/img/revpro/s06-2.png',
  '/slides/img/revpro/s07-0.png',
  '/slides/img/revpro/s08-0.png',
  '/slides/img/revpro/s08-1.png',
  '/slides/img/revpro/s09-0.png',
  '/slides/img/revpro/s09-1.png',
  '/slides/img/revpro/s10-0.png',
  '/slides/img/revpro/s10-1.png',
  '/slides/img/revpro/s11-0.png',
  '/slides/img/revpro/s11-1.png',
  '/slides/img/revpro/s12-0.jpg',
  '/slides/img/revpro/s12-1.png'
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
        // Cache hit - return response. Media elements issue Range requests,
        // so slice a 206 out of the cached body or playback breaks offline.
        if (response) {
          const rangeHeader = event.request.headers.get('range');
          if (rangeHeader) {
            return serveRange(response, rangeHeader);
          }
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

// Builds a 206 Partial Content response from a fully-cached media response.
// Video/audio elements request byte ranges (e.g. "bytes=0-"); replaying the
// cached 200 verbatim makes seeking and even initial playback fail.
async function serveRange(cachedResponse, rangeHeader) {
  const buffer = await cachedResponse.arrayBuffer();
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match) {
    return new Response(buffer, { status: 200 });
  }
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : buffer.byteLength - 1;
  const chunk = buffer.slice(start, end + 1);
  const headers = new Headers(cachedResponse.headers);
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + buffer.byteLength);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', chunk.byteLength);
  return new Response(chunk, { status: 206, statusText: 'Partial Content', headers });
}

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
