// Service Worker disabled during development — pass-through only.
// On activation it deletes every old cache and unregisters itself so
// stale precaches stop serving old builds. Restore caching for
// offline kiosk use before the show.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(names.map(name => caches.delete(name))))
            .then(() => self.registration.unregister())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
