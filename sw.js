/**
 * Mizan Ayyam — Production Service Worker (Offline-First)
 * Cache Name: mizan-ayyam-v1
 */

const CACHE_NAME = 'mizan-ayyam-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install: Pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Cleanup old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate with Network Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Handle navigation requests (HTML)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Handle CDN assets (Tailwind, Google Fonts) & static assets
  event.respondWith(
    caches.match(req).then((cachedResp) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        if (networkResp && networkResp.status === 200 && networkResp.type !== 'opaque') {
          const respToCache = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respToCache));
        } else if (networkResp && networkResp.type === 'opaque') {
          // Cache opaque responses (like external Google Fonts/CDN)
          const respToCache = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respToCache));
        }
        return networkResp;
      }).catch((err) => {
        return cachedResp;
      });

      return cachedResp || fetchPromise;
    })
  );
});
