// 루트 서비스워커 = "kill-switch".
// 예전 프롬프트나무 PWA가 /prompt-tree/ 스코프에 등록해 둔 서비스워커가
// 옛 index.html 을 캐시해 계속 보여주는 문제를 해소한다.
// 브라우저는 탐색 시 sw.js 업데이트를 자동 확인하므로, 옛 워커는 이 파일로
// 교체되고 → 모든 캐시 삭제 → 자기 등록 해제 → 열린 창을 새로고침한다.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});
// fetch 핸들러 없음 → 모든 요청은 네트워크로 직행(캐시 우회).
