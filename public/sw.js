// Starlinko Service Worker - PushAlert Integration
// Cache version: 2026-02-03-v2 (force refresh)
const CACHE_VERSION = 'starlinko-v2';

// Clear old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && !cacheName.includes('workbox')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Cache cleared, claiming clients');
      return self.clients.claim();
    })
  );
});

// Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version, skipping wait');
  self.skipWaiting();
});

// Import PushAlert
importScripts("https://cdn.pushalert.co/sw-87340.js");
