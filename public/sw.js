// Service Worker for LifeReset PWA
const CACHE_NAME = 'lifereset-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.tag);
    event.notification.close();

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url === self.registration.scope && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Handle push notifications (for future server-side push)
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    const options = {
        body: event.data ? event.data.text() : 'Time to check in on your progress!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'lifereset-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('LifeReset Reminder', options)
    );
});
