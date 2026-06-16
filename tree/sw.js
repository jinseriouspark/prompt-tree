// sw.js — 앱 셸 오프라인 캐시 (cache-first). 정적 토이라 단순 캐시로 충분.
const CACHE = "prompt-tree-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./src/main.js",
  "./src/garden.js",
  "./src/toneEngine.js",
  "./src/badges.js",
  "./src/share.js",
  "./src/report.js",
  "./src/config.js",
  "./src/skins/tree.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // 하나 실패해도 전체가 깨지지 않도록 개별 캐시
      Promise.allSettled(ASSETS.map((a) => c.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match("./index.html"))
    )
  );
});
