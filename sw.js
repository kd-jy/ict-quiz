/* ============================================================
   sw.js — 壳与数据的离线缓存（网络优先，失败回落到缓存）
   ============================================================ */

const CACHE = 'ictquiz-v15';
const ASSETS = [
  './',
  './index.html',
  './assets/styles.css',
  './assets/js/app.js',
  './assets/js/ui.js',
  './assets/js/store.js',
  './assets/js/quiz.js',
  './assets/js/views.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './data/questions.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((hit) => {
          if (hit) return hit;
          if (request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});











