// Service worker — caches the PWA shell and signals the page to drain the
// offline mint queue when connectivity returns. There is intentionally NO
// `/api/mint` mock here: minting requires the user's wallet, which is only
// available online from the page itself.
const CACHE_NAME = 'gachafi-shell-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Minimal branded offline fallback page.
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GachaFi — Offline</title>
<style>
:root { --bg:#0f0f1a; --fg:#e2e8f0; --accent:#a855f7; --muted:#64748b; }
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--fg);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}
.logo{width:64px;height:64px;margin-bottom:16px;border-radius:16px;background:linear-gradient(135deg,#a855f7,#ec4899);display:flex;align-items:center;justify-content:center;font-size:28px}
h1{font-size:1.5rem;margin-bottom:8px}
p{color:var(--muted);margin-bottom:24px;line-height:1.5;max-width:320px}
button{font:inherit;padding:12px 24px;border-radius:9999px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:var(--fg);cursor:pointer;transition:background .2s}
button:hover{background:rgba(255,255,255,0.1)}
</style>
</head>
<body>
<div class="logo">🎲</div>
<h1>You're offline</h1>
<p>GachaFi needs an internet connection to interact with the Radix blockchain. Your queued requests will retry automatically when you're back online.</p>
<button onclick="location.reload()">Retry</button>
</body>
</html>`;

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

// Fetch event - smarter caching to avoid stale PWA and not interfere with wallet links
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Network-first for navigations to always get the latest app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/');
        return cached || new Response(OFFLINE_HTML, {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for our static assets
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|svg|ico|webp|woff2?)$/i.test(url.pathname);
  if (isSameOrigin && isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: just fetch (don't cache cross-origin e.g., Radix endpoints, wallet links)
  event.respondWith(fetch(request));
});

// Listen for online events to process queued requests
self.addEventListener('online', () => {
  processOfflineQueue();
});

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
