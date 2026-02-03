// Starlinko Service Worker - PushAlert Integration
// Cache version: 2026-02-03-v3 (compatibility fix)
var CACHE_VERSION = 'starlinko-v3';

// Listen for skip waiting message from client
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Clear old caches on activation
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_VERSION && cacheName.indexOf('workbox') === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] Cache cleared, claiming clients');
      return self.clients.claim();
    }).catch(function(err) {
      console.error('[SW] Activation error:', err);
    })
  );
});

// Skip waiting to activate immediately
self.addEventListener('install', function(event) {
  console.log('[SW] Installing new version, skipping wait');
  self.skipWaiting();
});

// Import PushAlert with error handling
try {
  importScripts("https://cdn.pushalert.co/sw-87340.js");
} catch (e) {
  console.warn('[SW] PushAlert import failed:', e);
}
