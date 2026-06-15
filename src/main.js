// main.js — 입력 → 톤 엔진 → 정원 상태 → 화면 렌더 를 잇는다.

import { loadState, applyPrompt, resetState } from "./garden.js";
import { stageFromHealth, svgFor } from "./skins/tree.js";

let state = loadState();

const el = {
  stage: document.getElementById("stage"),
  health: document.getElementById("healthFill"),
  healthNum: document.getElementById("healthNum"),
  stageName: document.getElementById("stageName"),
  caption: document.getElementById("caption"),
  promptCount: document.getElementById("promptCount"),
  input: document.getElementById("prompt"),
  send: document.getElementById("send"),
  toast: document.getElementById("toast"),
  log: document.getElementById("log"),
  reset: document.getElementById("reset"),
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
  renderLog();
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
function flash(tone, delta) {
  const sign = delta >= 0 ? "+" : "";
  el.toast.innerHTML = `${tone.emoji} <b>${tone.label}</b> · 생명력 ${sign}${delta}
    <small>${tone.reasons.join(" · ")}</small>`;
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2600);
}

function submit() {
  const text = el.input.value.trim();
  if (!text) return;
  const res = applyPrompt(state, text);
  state = res.state;
  el.input.value = "";
  flash(res.tone, res.delta);
  render();
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

render();
