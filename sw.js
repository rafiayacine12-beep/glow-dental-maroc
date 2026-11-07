// Glow Dental — service worker: catalogue disponible même avec une connexion faible
const V = 'gd-v1';
const CORE = ['/', '/index.html', '/app.js', '/data/products.json', '/manifest.webmanifest', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/admin')) return;
  if (u.pathname.startsWith('/img/')) { // photos: cache d'abord
    e.respondWith(caches.open(V).then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { c.put(e.request, n.clone()); return n; }))));
    return;
  }
  // pages, données: réseau d'abord, cache si hors-ligne
  e.respondWith(fetch(e.request).then(n => { const cp = n.clone(); caches.open(V).then(c => c.put(e.request, cp)); return n; }).catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});
