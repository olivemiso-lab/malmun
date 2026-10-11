// ════════════════════════════════════════════════════
//  말문 · 서비스 워커 — 앱 파일을 캐시해 오프라인에서도 열리게 한다
//  ⚠ 배포할 때마다 VERSION을 올리고, 파일을 추가·삭제하면 APP_FILES도 고칠 것
//  (음성 인식은 크롬이 인터넷으로 처리하므로 오프라인에서는 ⌨️ 입력하기만 됨)
// ════════════════════════════════════════════════════
const VERSION = '2026-10-11-4';
const CACHE = 'malmun-' + VERSION;
const APP_FILES = [
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/core.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('malmun-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 인터넷이 되면 새 파일, 안 되면 캐시
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
