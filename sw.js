// BUG-LOGIN-01 fix:
// Don't cache HTML pages or API responses. The previous version cached
// `index.html` and Vite dev assets, which served stale 401/HTML responses
// to the browser and broke login after code changes.
//
// Strategy: NetworkFirst for everything. Cache only fully-qualified static
// assets (e.g. /assets/*, /icons/*) and only when we have an explicit
// successful response.

const CACHE_NAME = 'buildmaster-pos-v2';
const ASSETS = [
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cache) => cache !== CACHE_NAME)
          .map((cache) => caches.delete(cache))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API requests.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws')) {
    return;
  }

  // Never cache HTML (SPA shell) — always serve fresh from Vite.
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return;
  }

  // For static assets, NetworkFirst with cache fallback.
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
