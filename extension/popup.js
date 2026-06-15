// popup.js — 저장된 정원 상태를 보여준다. (stageFromHealth 는 engine.js 제공)

const KEY = "prompt-tree:ext";
const STAGE_COLOR = ["#6b5b4a", "#b08b3e", "#6f9d5a", "#3f8a35", "#e0689f"];

function paint(state) {
  const s = { health: 50, prompts: 0, streak: 0, ...(state || {}) };
  const stage = stageFromHealth(s.health);
  document.getElementById("emoji").textContent = stage.emoji;
  document.getElementById("name").textContent = stage.name;
  document.getElementById("h").textContent = Math.round(s.health);
  document.getElementById("p").textContent = s.prompts;
  document.getElementById("s").textContent = s.streak || 0;
  const fill = document.getElementById("fill");
  fill.style.width = s.health + "%";
  fill.style.background = STAGE_COLOR[stage.id];
}

chrome.storage.local.get(KEY, (o) => paint(o && o[KEY]));

document.getElementById("reset").addEventListener("click", () => {
  const fresh = { health: 50, prompts: 0, streak: 0 };
  chrome.storage.local.set({ [KEY]: fresh }, () => paint(fresh));
});
