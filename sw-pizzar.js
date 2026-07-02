// sw-pizzar.js — Service Worker PizzAR v2.5
// P3 ROBUSTEZ: cachea shell + menú para uso offline (Caja + Menú sin WiFi)

const CACHE_NAME = 'pizzar-v2.5';
const SHELL = [
  '/pizzAr/',
  '/pizzAr/index.html',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
];

// Instalar: cachear shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para Firestore (datos en tiempo real),
//        cache-first para el shell y assets estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firestore y Auth: siempre red (datos frescos)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return; // dejar pasar sin interceptar
  }

  // Shell y assets: cache-first con fallback a red
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cachear solo respuestas válidas del mismo origen o CDNs conocidos
        if (response && response.status === 200 &&
            (url.origin === self.location.origin ||
             url.hostname.includes('googleapis.com') ||
             url.hostname.includes('gstatic.com'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: mostrar la app cacheada si es una navegación
        if (e.request.mode === 'navigate') {
          return caches.match('/pizzAr/index.html');
        }
      });
    })
  );
});
