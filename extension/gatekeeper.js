// gatekeeper.js — 나무 문지기.
// 지정한 사이트(X·Instagram·TikTok·YouTube …)에 머문 시간을 재고,
// 사용 한도를 넘기면 화면 전체를 "자라는 나무" 오버레이로 덮어 휴식 시간 동안 막는다.
// 모든 계산/저장은 이 브라우저 안에서만(chrome.storage.local). 외부 전송 없음.

(() => {
  const HOST = location.hostname.replace(/^www\./, "");

  // --- 기본 설정 (popup 에서 변경) ----------------------------------------
  const DEFAULTS = {
    enabled: true,
    usageLimitMin: 20, // 이만큼 쓰면
    breakMin: 5,       // 이만큼 강제 휴식
    sites: ["x.com", "twitter.com", "instagram.com", "tiktok.com", "youtube.com", "facebook.com", "reddit.com"],
  };
  const CFG_KEY = "tree-gatekeeper:config";
  const stateKey = (h) => `tree-gatekeeper:state:${h}`;

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  function get(keys) {
    return new Promise((res) => {
      try { chrome.storage.local.get(keys, (o) => res(o || {})); }
      catch { res({}); }
    });
  }
  function set(obj) {
    try { chrome.storage.local.set(obj); } catch { /* 무시 */ }
  }

  let cfg = { ...DEFAULTS };
  // 사이트별 런타임 상태: 오늘 활성 누적초 + 휴식 종료시각
  let st = { day: todayStr(), activeSec: 0, breakUntil: 0 };
  let overlayEl = null;
  let tickTimer = null;
  let saveAcc = 0;

  async function loadAll() {
    const o = await get([CFG_KEY, stateKey(HOST)]);
    if (o[CFG_KEY]) cfg = { ...DEFAULTS, ...o[CFG_KEY] };
    if (o[stateKey(HOST)]) st = { ...st, ...o[stateKey(HOST)] };
    // 날짜가 바뀌면 누적 초기화
    if (st.day !== todayStr()) st = { day: todayStr(), activeSec: 0, breakUntil: 0 };
  }
  function persist() { set({ [stateKey(HOST)]: st }); }

  function isMonitored() {
    return cfg.enabled && cfg.sites.some((s) => HOST === s || HOST.endsWith("." + s));
  }

  // --- 오버레이 (Shadow DOM) ----------------------------------------------
  function buildOverlay() {
    const host = document.createElement("div");
    host.id = "tree-gatekeeper-overlay";
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host{ all: initial; }
        .wrap{
          position:fixed; inset:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:14px; text-align:center;
          font: 16px/1.5 -apple-system, "Apple SD Gothic Neo", "Segoe UI", sans-serif;
          color:#14130f;
          background: radial-gradient(120% 120% at 50% 0%, #eaf3e4 0%, #d8ead0 45%, #c7ddbd 100%);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          animation: fade .35s ease;
        }
        @keyframes fade{ from{ opacity:0 } to{ opacity:1 } }
        .scene{ width:min(78vw,420px); aspect-ratio:400/360; border-radius:20px; overflow:hidden;
          box-shadow:0 18px 60px #2c3a2433; background:#bcd6e6; }
        .title{ font-size:22px; font-weight:800; margin-top:4px; }
        .sub{ font-size:14px; color:#4b5a3f; max-width:320px; }
        .count{ font-size:40px; font-weight:800; letter-spacing:1px; color:#2f6b34; font-variant-numeric:tabular-nums; }
        .bar{ width:min(70vw,360px); height:10px; background:#ffffff80; border-radius:999px; overflow:hidden; }
        .fill{ height:100%; width:0%; background:linear-gradient(90deg,#7fae5f,#3f8a35); transition:width 1s linear; }
        .brand{ position:fixed; bottom:18px; font-size:12px; color:#5b6b4e; }
      </style>
      <div class="wrap">
        <div class="scene" id="tg-scene"></div>
        <div class="title">🌲 잠시 숲에서 쉬어가요</div>
        <div class="sub" id="tg-sub"></div>
        <div class="count" id="tg-count">--:--</div>
        <div class="bar"><div class="fill" id="tg-fill"></div></div>
        <div class="brand">나무 문지기 · Tree Gatekeeper</div>
      </div>`;
    (document.documentElement).appendChild(host);
    document.documentElement.style.overflow = "hidden";
    return {
      host,
      scene: shadow.getElementById("tg-scene"),
      sub: shadow.getElementById("tg-sub"),
      count: shadow.getElementById("tg-count"),
      fill: shadow.getElementById("tg-fill"),
    };
  }

  function fmt(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderBreak(refs) {
    const total = cfg.breakMin * 60;
    const left = Math.max(0, Math.ceil((st.breakUntil - Date.now()) / 1000));
    const progress = Math.max(0, Math.min(1, (total - left) / total)); // 0→1 동안 나무가 자람
    refs.scene.innerHTML = TreeArt.sceneSVG(progress * 100);
    refs.count.textContent = fmt(left);
    refs.fill.style.width = (progress * 100).toFixed(1) + "%";
    refs.sub.textContent = `${HOST} 에서 ${cfg.usageLimitMin}분을 채웠어요. 나무가 다 자랄 때까지 ${cfg.breakMin}분만 쉬어요.`;
    return left;
  }

  function startBreak() {
    if (!st.breakUntil || st.breakUntil <= Date.now()) {
      st.breakUntil = Date.now() + cfg.breakMin * 60 * 1000;
      st.activeSec = 0; // 휴식 시작 시 사용 누적 리셋
      persist();
    }
    if (overlayEl) return;
    const refs = buildOverlay();
    overlayEl = refs.host;
    renderBreak(refs);
    const iv = setInterval(() => {
      const left = renderBreak(refs);
      if (left <= 0) {
        clearInterval(iv);
        endBreak();
      }
    }, 1000);
  }

  function endBreak() {
    st.breakUntil = 0;
    st.activeSec = 0;
    st.day = todayStr();
    persist();
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
      document.documentElement.style.overflow = "";
    }
  }

  // --- 시간 누적 (보일 때만 1초씩) -----------------------------------------
  function tick() {
    if (st.day !== todayStr()) { st = { day: todayStr(), activeSec: 0, breakUntil: 0 }; }

    // 휴식 중이면 오버레이 유지
    if (st.breakUntil && st.breakUntil > Date.now()) { startBreak(); return; }

    const visible = document.visibilityState === "visible" && document.hasFocus();
    if (!visible) return;

    st.activeSec += 1;
    if (++saveAcc >= 5) { persist(); saveAcc = 0; } // 5초마다 저장

    if (st.activeSec >= cfg.usageLimitMin * 60) startBreak();
  }

  // --- 설정 변경 실시간 반영 -----------------------------------------------
  try {
    chrome.storage.onChanged.addListener((ch) => {
      if (ch[CFG_KEY]) {
        cfg = { ...DEFAULTS, ...ch[CFG_KEY].newValue };
        if (!isMonitored()) endBreak();
      }
    });
  } catch { /* 무시 */ }

  // --- 시작 ----------------------------------------------------------------
  loadAll().then(() => {
    if (!isMonitored()) return;
    if (st.breakUntil && st.breakUntil > Date.now()) startBreak();
    tickTimer = setInterval(tick, 1000);
  });
})();
