// Simple offline-first service worker for static assets
const CACHE_NAME = 'agrisync-v1';
const ASSETS = ['/', '/index.html', '/vite.svg', '/manifest.json'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS).catch(()=>{}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
  );
});

self.addEventListener('fetch', (e) => {
  // network first for API calls, cache-first for assets (simple heuristic)
  const url = new URL(e.request.url);
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.includes('/farmers') ||
    url.pathname.includes('/collections')
  ) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      try { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, copy)); } catch {}
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});