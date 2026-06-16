// popup.js — 나무 문지기 설정 UI. 저장은 chrome.storage.local 한 곳.

const CFG_KEY = "tree-gatekeeper:config";
const DEFAULTS = {
  enabled: true,
  usageLimitMin: 20,
  breakMin: 5,
  sites: ["x.com", "twitter.com", "instagram.com", "tiktok.com", "youtube.com", "facebook.com", "reddit.com"],
};
// 화면에 고를 수 있는 사이트(= manifest content_scripts 와 일치)
const ALL_SITES = [
  ["x.com", "X"],
  ["twitter.com", "Twitter"],
  ["instagram.com", "Instagram"],
  ["tiktok.com", "TikTok"],
  ["youtube.com", "YouTube"],
  ["facebook.com", "Facebook"],
  ["reddit.com", "Reddit"],
];

let cfg = { ...DEFAULTS };

const $ = (id) => document.getElementById(id);

function renderSites() {
  const box = $("sites");
  box.innerHTML = "";
  ALL_SITES.forEach(([host, label]) => {
    const on = cfg.sites.includes(host);
    const chip = document.createElement("span");
    chip.className = "chip" + (on ? " on" : "");
    chip.textContent = label;
    chip.addEventListener("click", () => {
      if (cfg.sites.includes(host)) cfg.sites = cfg.sites.filter((s) => s !== host);
      else cfg.sites = [...cfg.sites, host];
      renderSites();
    });
    box.appendChild(chip);
  });
}

function renderEnabled() {
  const el = $("enabled");
  el.textContent = cfg.enabled ? "켜짐" : "꺼짐";
  el.className = "switch " + (cfg.enabled ? "on" : "off");
}

function paint() {
  renderEnabled();
  $("usage").value = cfg.usageLimitMin;
  $("break").value = cfg.breakMin;
  renderSites();
}

$("enabled").addEventListener("click", () => { cfg.enabled = !cfg.enabled; renderEnabled(); });

$("save").addEventListener("click", () => {
  cfg.usageLimitMin = Math.max(1, Math.min(240, parseInt($("usage").value, 10) || DEFAULTS.usageLimitMin));
  cfg.breakMin = Math.max(1, Math.min(60, parseInt($("break").value, 10) || DEFAULTS.breakMin));
  chrome.storage.local.set({ [CFG_KEY]: cfg }, () => {
    const s = $("saved");
    s.textContent = "저장됐어요 ✓ (해당 탭 새로고침하면 적용)";
    setTimeout(() => (s.textContent = ""), 2500);
  });
});

chrome.storage.local.get(CFG_KEY, (o) => {
  if (o && o[CFG_KEY]) cfg = { ...DEFAULTS, ...o[CFG_KEY] };
  paint();
});
