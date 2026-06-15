// content.js — ChatGPT/Claude 입력창을 관찰해 "보내기"를 감지하고,
// 그 프롬프트의 말투로 떠 있는 나무를 키운다. 분석은 전부 이 페이지(기기) 안에서만.
// engine.js 의 analyzeTone / applyTone / stageFromHealth 를 같은 스코프에서 쓴다.

(() => {
  const KEY = "prompt-tree:ext";
  let state = { health: 50, prompts: 0, streak: 0, lastDay: null, lastText: "", lastAt: 0 };

  // 로컬 날짜 키 (YYYY-MM-DD) 와 연속일 계산 (웹앱 garden.js 와 동일 규칙)
  function dayKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function nextStreak(prev, lastDay, today) {
    if (lastDay === today) return prev || 0;
    if (lastDay) {
      const diff = Math.round(
        (new Date(today + "T00:00:00") - new Date(lastDay + "T00:00:00")) / 86400000
      );
      if (diff === 1) return (prev || 0) + 1;
    }
    return 1;
  }

  // --- 상태 로드/저장 ------------------------------------------------------
  function load() {
    return new Promise((res) => {
      try {
        chrome.storage.local.get(KEY, (o) => {
          if (o && o[KEY]) state = { ...state, ...o[KEY] };
          res();
        });
      } catch {
        res();
      }
    });
  }
  function save() {
    try {
      chrome.storage.local.set({ [KEY]: state });
    } catch {
      /* 무시 */
    }
  }

  // --- 입력창 찾기 ---------------------------------------------------------
  const COMPOSER_SELECTORS = [
    "#prompt-textarea", // ChatGPT (contenteditable)
    "div.ProseMirror[contenteditable='true']", // Claude
    "form textarea", // 구버전/폴백
    "div[contenteditable='true']",
  ];

  function findComposer(from) {
    // 이벤트 타깃이 입력창 안이면 그걸 우선 사용
    if (from) {
      for (const sel of COMPOSER_SELECTORS) {
        const c = from.closest ? from.closest(sel) : null;
        if (c) return c;
      }
    }
    for (const sel of COMPOSER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function readText(node) {
    if (!node) return "";
    if (node.tagName === "TEXTAREA") return node.value || "";
    return (node.innerText || node.textContent || "").trim();
  }

  // --- 보내기 처리 ---------------------------------------------------------
  function handleSend(text) {
    const t = (text || "").trim();
    if (!t) return;
    // 중복 방지(엔터 + 버튼 동시 발화 등)
    const now = Date.now();
    if (t === state.lastText && now - state.lastAt < 1500) return;
    state.lastText = t;
    state.lastAt = now;

    const today = dayKey(now);
    const streak = nextStreak(state.streak, state.lastDay, today);
    const { tone, delta, next } = applyTone(state, t);
    state = { ...next, streak, lastDay: today, lastText: t, lastAt: now };
    save();
    update(tone, delta);
  }

  // --- 위젯 (Shadow DOM) ---------------------------------------------------
  let shadow, ui;
  function mountWidget() {
    const host = document.createElement("div");
    host.id = "prompt-tree-host";
    host.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483647;";
    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host{ all: initial; }
        .card{
          font: 13px/1.4 -apple-system, "Apple SD Gothic Neo", "Segoe UI", sans-serif;
          width: 184px; background:#fff; color:#14130f;
          border:1px solid #e7e3d8; border-radius:16px; padding:12px 14px;
          box-shadow: 0 8px 28px #14130f24; user-select:none;
        }
        .top{ display:flex; align-items:center; justify-content:space-between; }
        .emoji{ font-size:30px; line-height:1; transition: transform .35s ease; }
        .name{ font-weight:800; font-size:13px; }
        .num{ color:#6f6a60; font-size:11px; }
        .bar{ height:8px; background:#ece8dd; border-radius:999px; overflow:hidden; margin:8px 0 4px; }
        .fill{ height:100%; width:50%; border-radius:999px; background:#6f9d5a; transition: width .5s cubic-bezier(.2,.7,.2,1), background .5s; }
        .meta{ color:#6f6a60; font-size:11px; }
        .toast{ margin-top:6px; font-size:11px; font-weight:700; min-height:14px; opacity:0; transition:opacity .2s; }
        .toast.show{ opacity:1; }
        .pop{ transform: scale(1.18); }
        .brand{ margin-top:6px; font-size:10px; color:#b8b2a4; }
      </style>
      <div class="card">
        <div class="top">
          <span class="name" id="pt-name">평범한 나무</span>
          <span class="num"><b id="pt-h">50</b>/100</span>
        </div>
        <div class="bar"><div class="fill" id="pt-fill"></div></div>
        <div class="top">
          <span class="emoji" id="pt-emoji">🌿</span>
          <span class="meta">🌱 <b id="pt-p">0</b> · 🔥 <span id="pt-s">0</span>일</span>
        </div>
        <div class="toast" id="pt-toast"></div>
        <div class="brand">프롬프트 나무 Pro</div>
      </div>`;
    (document.body || document.documentElement).appendChild(host);
    ui = {
      name: shadow.getElementById("pt-name"),
      h: shadow.getElementById("pt-h"),
      fill: shadow.getElementById("pt-fill"),
      emoji: shadow.getElementById("pt-emoji"),
      p: shadow.getElementById("pt-p"),
      s: shadow.getElementById("pt-s"),
      toast: shadow.getElementById("pt-toast"),
    };
  }

  const STAGE_COLOR = ["#6b5b4a", "#b08b3e", "#6f9d5a", "#3f8a35", "#e0689f"];
  let toastTimer;
  function update(tone, delta) {
    if (!ui) return;
    const stage = stageFromHealth(state.health);
    ui.name.textContent = stage.name;
    ui.emoji.textContent = stage.emoji;
    ui.h.textContent = Math.round(state.health);
    ui.fill.style.width = state.health + "%";
    ui.fill.style.background = STAGE_COLOR[stage.id];
    ui.p.textContent = state.prompts;
    ui.s.textContent = state.streak || 0;
    if (tone) {
      const sign = delta >= 0 ? "+" : "";
      ui.toast.textContent = `${tone.emoji} ${tone.label} ${sign}${delta}`;
      ui.toast.style.color = delta >= 0 ? "#2f8f3e" : "#c0492f";
      ui.toast.classList.add("show");
      ui.emoji.classList.add("pop");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        ui.toast.classList.remove("show");
        ui.emoji.classList.remove("pop");
      }, 2400);
    }
  }

  // --- 이벤트 바인딩 -------------------------------------------------------
  function isSendButton(node) {
    const btn = node.closest && node.closest("button");
    if (!btn) return false;
    const test = (btn.getAttribute("data-testid") || "").toLowerCase();
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
    return (
      test.includes("send") ||
      aria.includes("send") ||
      aria.includes("보내기") ||
      aria.includes("메시지 보내기")
    );
  }

  function bind() {
    // 엔터 전송 (Shift 없이) — 입력 비워지기 전에 캡처
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
        const composer = findComposer(e.target);
        if (!composer) return;
        handleSend(readText(composer));
      },
      true
    );
    // 보내기 버튼 클릭
    document.addEventListener(
      "click",
      (e) => {
        if (!isSendButton(e.target)) return;
        const composer = findComposer();
        handleSend(readText(composer));
      },
      true
    );
  }

  // --- 시작 ----------------------------------------------------------------
  load().then(() => {
    mountWidget();
    update(null, 0);
    bind();
  });
})();
