// Starlinko Service Worker - VAPID Web Push + PushAlert Integration
// Cache version: 2026-02-22-v4
var CACHE_VERSION = 'starlinko-v4';

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

// Handle push notifications (VAPID Web Push)
self.addEventListener('push', function(event) {
  console.log('[SW] Push received');

  var data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Starlinko', body: event.data.text() };
    }
  }

  var title = data.title || 'Starlinko';
  var options = {
    body: data.body || '',
    icon: data.icon || '/icon-512x512.png',
    badge: '/icon-192x192.svg',
    data: { url: data.url || '/reviews' },
    vibrate: [200, 100, 200],
    tag: 'starlinko-' + Date.now(),
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click');
  event.notification.close();

  var urlToOpen = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/reviews';

  // If relative URL, make it absolute
  if (urlToOpen.startsWith('/')) {
    urlToOpen = self.location.origin + urlToOpen;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if available
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(urlToOpen);
    })
  );
});

// Import PushAlert with error handling
try {
  importScripts("https://cdn.pushalert.co/sw-87340.js");
} catch (e) {
  console.warn('[SW] PushAlert import failed:', e);
}
