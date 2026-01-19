// Starlinko Service Worker - Push Notifications Handler

// Cache name for offline support
const CACHE_NAME = 'starlinko-v1';

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Starlinko',
    body: 'Nouvelle notification',
    icon: '/icon-512x512.png',
    badge: '/icon-192x192.svg',
    url: '/reviews',
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: 'starlinko-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url,
      ...data.data,
    },
    actions: [
      {
        action: 'view',
        title: 'Voir',
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/reviews';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes('starlinko') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if no existing one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
