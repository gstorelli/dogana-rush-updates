/* DOGANA RUSH — service worker per la base PWA/Android.
   Cache dei file principali; gli asset richiesti vengono aggiunti al volo.
   Aggiornamenti: js/update.js può chiedere l'attivazione immediata del nuovo
   worker con postMessage({ type: 'SKIP_WAITING' }) e poi pulire le cache prima
   del reload, così i file nuovi non vengono serviti dalla cache vecchia.
   Cache versionata (v18): al primo avvio dopo un update la cache precedente
   viene eliminata in activate. */
const CACHE = 'dogana-rush-v18';
const CORE = [
  './', './index.html', './css/game.css',
  './js/art.js', './js/audio.js', './js/voices.js', './js/sprites.js', './js/game.js',
  './js/killswitch.js', './js/update-config.js', './js/update.js',
  './assets/adele-portrait.png', './assets/rocco-portrait.png',
  './assets/pwa/icon-192.png', './assets/pwa/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Il client (js/update.js) chiede di attivare subito il worker in attesa.
self.addEventListener('message', event => {
  const data = event.data;
  if (data && data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Solo same-origin: le richieste cross-origin (es. version.json del canale
  // aggiornamenti) vanno dritte in rete, senza risposte di fallback che
  // potrebbero restituire index.html al posto del JSON.
  if (url.origin !== location.origin) return;
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
