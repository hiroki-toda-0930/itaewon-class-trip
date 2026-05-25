// Service Worker for 梨泰院クラス聖地巡礼 旅のしおり
const CACHE = 'itaewon-trip-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './spots/style.css',
  './spots/world-gourmet-street.html',
  './spots/jacks-bar.html',
  './spots/kkulbam.html',
  './spots/noksapyeong-bridge.html',
  './spots/club-pumpkin.html',
  './spots/g-guesthouse.html',
  './spots/seoulpam.html',
  './spots/itaewon-park.html',
  './spots/plain-note.html',
  './spots/oriole.html',
  './spots/sky-tower-namsan.html',
  './spots/baekak.html',
  './spots/nandong-konkoro.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first for live APIs (weather, FX) — don't cache stale data
  if (url.hostname === 'api.open-meteo.com' || url.hostname === 'api.frankfurter.dev') {
    e.respondWith(fetch(req).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Network-first for HTML (so updates show without manual reload)
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for other assets (css, images, manifest)
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
