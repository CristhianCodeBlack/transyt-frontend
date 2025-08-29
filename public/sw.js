const CACHE_NAME = 'transyt-v2-fast';
const STATIC_CACHE = 'transyt-static-v2';

// Solo cachear recursos estáticos críticos
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

// No cachear APIs para evitar datos obsoletos
const NO_CACHE_URLS = [
  '/api/',
  'transyt-backend.onrender.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activar inmediatamente
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {}) // No fallar si no se puede cachear
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // No cachear APIs ni requests externos
  if (NO_CACHE_URLS.some(pattern => url.includes(pattern))) {
    return event.respondWith(fetch(event.request));
  }
  
  // Cache-first para recursos estáticos
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((fetchResponse) => {
            // Solo cachear recursos exitosos y estáticos
            if (fetchResponse.status === 200 && 
                (url.includes('.js') || url.includes('.css') || url.includes('.png'))) {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => cache.put(event.request, responseClone))
                .catch(() => {}); // No fallar si no se puede cachear
            }
            return fetchResponse;
          })
          .catch(() => {
            // Fallback para offline
            return caches.match('/');
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});