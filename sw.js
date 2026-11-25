/* sw.js — 홈 화면 앱용: 그림은 저장해 두고(빠르게), 게임 코드와 환율은 항상 새 것을 먼저 받아요(인터넷이 없으면 저장본). */
const CACHE = "fxtrader-202611251140";
const CORE = ["./", "index.html", "style.css", "data.js", "map.js", "live.js", "game.js", "story.js", "extras.js", "ui.js", "manifest.webmanifest"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isAsset = new URL(req.url).pathname.includes("/assets/");
  if (isAsset) {   // 그림: 저장본 먼저
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  } else {         // 코드·환율: 새 것 먼저, 실패하면 저장본
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req)));
  }
});
