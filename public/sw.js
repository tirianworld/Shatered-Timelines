// CDD Gacha 2 Service Worker - Stale-While-Revalidate para imagenes y Network-First para el resto
const ASSETS_CACHE = 'cdd-gacha-assets-v3';
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== ASSETS_CACHE).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isGameImage =
    (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/items/')) &&
    IMAGE_EXT_RE.test(url.pathname);

  if (isGameImage) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request)
          .then((res) => {
            const ct = res.headers.get('content-type') || '';
            if (res.ok && res.type === 'basic' && ct.startsWith('image/')) {
              cache.put(event.request, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
