// sw-pizzar.js — Service Worker PizzAR v2.6
// P3 ROBUSTEZ: cachea shell para uso offline completo

const CACHE_NAME = 'pizzar-v2.6';
const SHELL = [
  '/pizzAr/',
  '/pizzAr/index.html',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('identitytoolkit.googleapis.com') || url.hostname.includes('securetoken.googleapis.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && (url.origin === self.location.origin || url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com'))) {
          caches.open(CACHE_NAME).then(c => c.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => { if (e.request.mode === 'navigate') return caches.match('/pizzAr/index.html'); });
    })
  );
});
