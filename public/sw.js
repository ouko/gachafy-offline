// Enhanced service worker with offline request queuing
const CACHE_NAME = 'gachafi-poc-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, handle offline requests
self.addEventListener('fetch', (event) => {
  // Handle mint requests when offline
  if (event.request.url.includes('/api/mint') && !navigator.onLine) {
    event.respondWith(
      new Response(JSON.stringify({ queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Listen for online events to process queued requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PROCESS_QUEUE') {
    processOfflineQueue();
  }
});

async function processOfflineQueue() {
  // This will be handled by the main thread
  // Send message to main thread to process queue
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
  });
}