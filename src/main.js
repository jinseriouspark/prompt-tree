// main.js — 입력 → 톤 엔진 → 정원 상태 → 화면 렌더 를 잇는다.

import { loadState, applyPrompt, resetState } from "./garden.js";
import { stageFromHealth, svgFor } from "./skins/tree.js";
import { BADGES, badgeById } from "./badges.js";
import { buildShareCard, shareCard } from "./share.js";
import { WAITLIST_URL, PRO_PRICE } from "./config.js";

let state = loadState();

const el = {
  stage: document.getElementById("stage"),
  health: document.getElementById("healthFill"),
  healthNum: document.getElementById("healthNum"),
  stageName: document.getElementById("stageName"),
  caption: document.getElementById("caption"),
  promptCount: document.getElementById("promptCount"),
  streak: document.getElementById("streak"),
  badges: document.getElementById("badges"),
  input: document.getElementById("prompt"),
  send: document.getElementById("send"),
  toast: document.getElementById("toast"),
  log: document.getElementById("log"),
  reset: document.getElementById("reset"),
  share: document.getElementById("share"),
  proPrice: document.getElementById("proPrice"),
  waitlist: document.getElementById("waitlist"),
  waitlistEmail: document.getElementById("waitlistEmail"),
  waitlistMsg: document.getElementById("waitlistMsg"),
};

// 사진(stage-N.jpg)이 있으면 보여주고, 없으면 SVG로 폴백한다.
function renderTree(stage) {
  const img = new Image();
  img.alt = stage.name;
  img.className = "tree-photo";
  img.onload = () => {
    el.stage.innerHTML = "";
    el.stage.appendChild(img);
  };
  img.onerror = () => {
    el.stage.innerHTML = svgFor(stage.id);
  };
  img.src = stage.photo + "?v=1";
}

function render() {
  const stage = stageFromHealth(state.health);
  renderTree(stage);
  el.health.style.width = state.health + "%";
  el.health.dataset.stage = stage.id;
  el.healthNum.textContent = Math.round(state.health);
  el.stageName.textContent = stage.name;
  el.caption.textContent = stage.caption;
  el.promptCount.textContent = state.prompts;
  el.streak.textContent = state.streak || 0;
  renderBadges();
  renderLog();
}

function renderBadges() {
  const have = new Set(state.badges || []);
  el.badges.innerHTML = BADGES.map((b) => {
    const owned = have.has(b.id);
    return `<li class="badge ${owned ? "on" : "off"}" title="${b.name} — ${b.desc}">
      <span class="badge-emoji">${b.emoji}</span>
    </li>`;
  }).join("");
}

function renderLog() {
  el.log.innerHTML = state.history
    .map((h) => {
      const sign = h.delta >= 0 ? "+" : "";
      const cls = h.delta >= 0 ? "up" : "down";
      const safe = h.text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      return `<li>
        <span class="log-emoji">${h.tone.emoji}</span>
        <span class="log-text">${safe || "(빈 프롬프트)"}</span>
        <span class="log-delta ${cls}">${sign}${h.delta}</span>
      </li>`;
    })
    .join("");
}

let toastTimer = null;
function flash(html) {
  el.toast.innerHTML = html;
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2800);
}

function toneToast(tone, delta) {
  const sign = delta >= 0 ? "+" : "";
  return `${tone.emoji} <b>${tone.label}</b> · 생명력 ${sign}${delta}
    <small>${tone.reasons.join(" · ")}</small>`;
}

function badgeToast(ids) {
  const names = ids.map((id) => {
    const b = badgeById(id);
    return `${b.emoji} ${b.name}`;
  });
  return `🎉 <b>새 뱃지!</b> <small>${names.join(" · ")}</small>`;
}

function submit() {
  const text = el.input.value.trim();
  if (!text) return;
  const res = applyPrompt(state, text);
  state = res.state;
  el.input.value = "";
  flash(toneToast(res.tone, res.delta));
  render();
  // 새 뱃지가 있으면 톤 토스트 다음에 이어서 보여준다.
  if (res.newBadges.length) {
    setTimeout(() => flash(badgeToast(res.newBadges)), 2900);
  }
}

el.send.addEventListener("click", submit);
el.input.addEventListener("keydown", (e) => {
  // Enter 전송 / Shift+Enter 줄바꿈
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submit();
  }
});
el.reset.addEventListener("click", () => {
  if (confirm("정원을 처음 상태로 되돌릴까요?")) {
    state = resetState();
    render();
  }
});

// --- 공유 카드 ------------------------------------------------------------
el.share.addEventListener("click", async () => {
  el.share.disabled = true;
  const prev = el.share.textContent;
  el.share.textContent = "🌳 만드는 중…";
  try {
    const stage = stageFromHealth(state.health);
    const blob = await buildShareCard({ stage, state });
    const how = await shareCard(blob, { stage, state });
    if (how === "downloaded") flash("🌳 <b>이미지 저장됨</b> <small>SNS에 자랑해보세요</small>");
  } catch (err) {
    flash("⚠️ <b>공유 실패</b> <small>다시 시도해주세요</small>");
  } finally {
    el.share.disabled = false;
    el.share.textContent = prev;
  }
});

// --- Pro 웨이트리스트 -----------------------------------------------------
const WAITLIST_KEY = "prompt-tree:waitlist";

el.proPrice.textContent = PRO_PRICE;

el.waitlist.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = el.waitlistEmail.value.trim();
  if (!email) return;

  // 외부 폼 URL 이 설정돼 있으면 그쪽으로 보낸다(이메일을 쿼리로 프리필).
  if (WAITLIST_URL) {
    const sep = WAITLIST_URL.includes("?") ? "&" : "?";
    window.open(`${WAITLIST_URL}${sep}email=${encodeURIComponent(email)}`, "_blank");
  }

  // 외부 전송이 없어도(기본값) 로컬에 모아두고 감사 메시지를 띄운다.
  try {
    const list = JSON.parse(localStorage.getItem(WAITLIST_KEY) || "[]");
    if (!list.includes(email)) list.push(email);
    localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
  } catch {
    /* 저장 불가 시 무시 */
  }

  el.waitlist.reset();
  el.waitlistMsg.textContent = "🌿 등록 완료! 출시되면 가장 먼저 알려드릴게요.";
});

render();
