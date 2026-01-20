// Firebase Messaging Service Worker for Starlinko
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyCzCHN8FPR3cjU36G6nAGOIY-HOhVU-u9I",
  authDomain: "starlinko-db94e.firebaseapp.com",
  projectId: "starlinko-db94e",
  storageBucket: "starlinko-db94e.firebasestorage.app",
  messagingSenderId: "37013451864",
  appId: "1:37013451864:web:4448ba2fceaab93bd9062d",
  measurementId: "G-3VQ00QKBLN"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Starlinko';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nouvelle notification',
    icon: payload.notification?.icon || '/icon-512x512.png',
    badge: '/icon-192x192.svg',
    vibrate: [200, 100, 200],
    tag: 'starlinko-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.data?.url || '/reviews',
      ...payload.data,
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

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/reviews';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Activating');
  event.waitUntil(self.clients.claim());
});
