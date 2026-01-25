// Starlinko Push Notification Service Worker (Native Web Push - VAPID)
// This replaces Firebase messaging with standard Web Push Protocol

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[sw.js] Push event received:', event);
  
  let data = { title: 'Starlinko', body: 'Nouvelle notification', url: '/reviews' };
  
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[sw.js] Push data parsed:', data);
    } catch (e) {
      console.log('[sw.js] Push data as text:', event.data.text());
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/icon-512x512.png',
    badge: '/icon-192x192.svg',
    vibrate: [200, 100, 200],
    tag: 'starlinko-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/reviews',
      ...data,
    },
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Starlinko', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/reviews';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[sw.js] Notification closed');
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[sw.js] Installing...');
  // Don't call skipWaiting to prevent reload loops
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[sw.js] Activating...');
  event.waitUntil(self.clients.claim());
});
