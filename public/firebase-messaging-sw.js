/* ANTIKER Firebase Cloud Messaging Service Worker */
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAvFIJBBhvS9Tbtx9SD1olk3sYuXTjLeyY',
  authDomain: 'gen-lang-client-0158019776.firebaseapp.com',
  projectId: 'gen-lang-client-0158019776',
  storageBucket: 'gen-lang-client-0158019776.firebasestorage.app',
  messagingSenderId: '135780036830',
  appId: '1:135780036830:web:ccabe692f46636c0cf924f',
});

const messaging = firebase.messaging();

// Handle data-only background payloads without duplicating native notification payloads
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) {
    return;
  }

  const data = payload.data || {};
  const title = data.title || 'ANTIKER';
  const options = {
    body: data.body || 'New curated pieces have arrived at ANTIKER.',
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'antiker-announcement',
    renotify: true,
    data: {
      url: data.url || '/shop',
    },
  };

  if (data.imageUrl) {
    options.image = data.imageUrl;
  }

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawData = event.notification.data || {};
  const fcmData = rawData.FCM_MSG && rawData.FCM_MSG.data ? rawData.FCM_MSG.data : {};
  const requestedUrl = rawData.url || fcmData.url || '/shop';

  let safeTargetUrl = new URL('/shop', self.location.origin).href;
  try {
    const parsed = new URL(requestedUrl, self.location.origin);
    if (parsed.origin === self.location.origin) {
      safeTargetUrl = parsed.href;
    }
  } catch {
    safeTargetUrl = new URL('/shop', self.location.origin).href;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus().then((focused) => {
              if (focused && 'navigate' in focused) {
                return focused.navigate(safeTargetUrl);
              }
              return focused;
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(safeTargetUrl);
        }
        return undefined;
      })
  );
});
