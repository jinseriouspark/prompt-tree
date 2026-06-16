// skins/tree.js
// 한국 소나무(松) 스킨 — 묘목(seedling)부터 노송(老松)까지 생명력에 따라 연속 성장.
// 둥근 활엽수가 아니라, 적갈색으로 휜 줄기 + 층층이 쌓인 솔잎(녹) + 솔방울로 그린다.
// 사진(stage-N.jpg)은 5단계 폴백 슬롯으로 유지하고, 없으면 이 연속 SVG 를 쓴다.

export const STAGES = [
  { id: 0, name: "죽은 묘목", caption: "말라 죽은 묘목. 거친 말이 뿌리째 말렸다.", photo: "assets/tree/stage-0.jpg" },
  { id: 1, name: "시드는 묘목", caption: "솔잎이 누레진 묘목. 톤을 바꾸면 아직 산다.", photo: "assets/tree/stage-1.jpg" },
  { id: 2, name: "어린 소나무", caption: "겨우 자리잡았다. 조금 더 다정하면 솔이 우거진다.", photo: "assets/tree/stage-2.jpg" },
  { id: 3, name: "푸른 소나무", caption: "솔잎이 짙푸르다. 좋은 프롬프트가 키운 결과다.", photo: "assets/tree/stage-3.jpg" },
  { id: 4, name: "노송 (老松)", caption: "솔방울 맺힌 노송. 당신의 말이 이렇게 자랐다.", photo: "assets/tree/stage-4.jpg" },
];

export function stageFromHealth(health) {
  if (health <= 15) return STAGES[0];
  if (health <= 38) return STAGES[1];
  if (health <= 61) return STAGES[2];
  if (health <= 84) return STAGES[3];
  return STAGES[4];
}

// --- 레벨(1~100) + 세밀한 단계 이름 (소나무 버전) ------------------------
const LEVEL_NAMES = [
  [0, "죽은 묘목", "🪵"],
  [9, "마른 묘목", "🥀"],
  [17, "겨우 산 묘목", "🌱"],
  [25, "새순 묘목", "🌱"],
  [34, "어린 소나무", "🌿"],
  [43, "푸른 솔", "🌲"],
  [52, "제법 소나무", "🌲"],
  [61, "우거진 솔", "🌲"],
  [70, "든든한 소나무", "🌲"],
  [79, "솔향 가득", "🌲"],
  [88, "솔방울 맺힌 소나무", "🌰"],
  [95, "노송 (老松)", "🌲"],
];

export function levelInfo(health) {
  const h = Math.max(0, Math.min(100, health));
  let name = LEVEL_NAMES[0][1];
  let emoji = LEVEL_NAMES[0][2];
  for (const [min, nm, em] of LEVEL_NAMES) {
    if (h >= min) { name = nm; emoji = em; }
  }
  return { level: Math.round(h), name, emoji, stage: stageFromHealth(h) };
}

// --- 색 보간 유틸 ---------------------------------------------------------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const c = (x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpHex(a, b, t) {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  return rgbToHex([lerp(ra[0], rb[0], t), lerp(ra[1], rb[1], t), lerp(ra[2], rb[2], t)]);
}
function multiStop(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      return lerpHex(c0, c1, (t - p0) / (p1 - p0));
    }
  }
  return stops[stops.length - 1][1];
}

const SKY_TOP = [[0, "#3a3f47"], [0.18, "#7b7a72"], [0.45, "#bcd6e6"], [0.7, "#7fc1f0"], [0.9, "#ffd27a"], [1, "#ffcb63"]];
const SKY_BOT = [[0, "#5a5048"], [0.18, "#c3bca8"], [0.45, "#e3eef1"], [0.7, "#d8f0ff"], [0.9, "#fff3d6"], [1, "#fff3d6"]];
const GROUND = [[0, "#6f6452"], [0.2, "#9a8d6e"], [0.4, "#7fae5f"], [0.7, "#6fbf57"], [1, "#8fd06a"]];
// 솔잎: 죽음(갈색) → 누런 묘목 → 짙은 솔녹
const NEEDLE = [[0.05, "#7a6a40"], [0.18, "#9a9148"], [0.34, "#4f7a3a"], [0.5, "#356b34"], [1, "#234d28"]];

function ell(cx, cy, rx, ry, fill, op = 1) {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" opacity="${op}"/>`;
}

/**
 * 생명력(0~100)으로 연속적인 소나무 장면을 그린다.
 */
export function svgForHealth(health) {
  const t = Math.max(0, Math.min(1, health / 100));
  const skyTop = multiStop(SKY_TOP, t);
  const skyBot = multiStop(SKY_BOT, t);
  const ground = multiStop(GROUND, t);
  const needle = multiStop(NEEDLE, t);
  const needleDark = lerpHex(needle, "#173a1a", 0.4);
  const needleLight = lerpHex(needle, "#9bd07e", 0.5);

  let s = `<rect width="400" height="360" fill="url(#sky)"/>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBot}"/>
    </linearGradient>`;

  // 하늘: 폭풍(낮음) / 구름(중간) / 황금 햇살(높음)
  if (t < 0.18) {
    s += ell(120, 58, 78, 26, "#2c3036", (0.7 * (1 - t / 0.18)).toFixed(2))
      + ell(270, 46, 86, 28, "#2c3036", (0.6 * (1 - t / 0.18)).toFixed(2));
  } else if (t > 0.6) {
    const r = t > 0.88 ? 150 : 90;
    s += `<circle cx="306" cy="76" r="${r}" fill="url(#sunG)"/>
      <circle cx="306" cy="76" r="${t > 0.88 ? 32 : 22}" fill="${t > 0.88 ? "#fff2c4" : "#fff4cf"}"/>`;
    if (t > 0.45 && t <= 0.88) s += ell(108, 68, 44, 18, "#ffffff", 0.8);
  }

  // 땅 + 그림자
  s += `<path d="M0 300 Q200 286 400 300 L400 360 L0 360 Z" fill="${ground}"/>`;
  s += ell(200, 306, lerp(34, 120, t), 12, "#000", lerp(0.2, 0.12, t));

  const growth = Math.max(0, Math.min(1, (t - 0.05) / 0.95)); // 0~1

  // 죽은 묘목: 앙상한 갈색 막대 + 떨어진 솔잎
  if (growth <= 0.02) {
    s += `<path d="M200 300 Q196 280 198 258 M198 270 L186 262 M199 264 L210 256"
      stroke="#6a5236" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += ell(176, 322, 8, 3, "#7a6a40") + ell(232, 326, 7, 3, "#6a5b38");
    return s;
  }

  // 휜 줄기 (적갈색). 자랄수록 높고 굵게.
  const topY = lerp(256, 104, growth);
  const lean = lerp(2, 10, growth); // 살짝 휘는 정도
  const tw = lerp(3, 11, growth);
  s += `<path d="M${200 + tw} 302
      C ${198 + tw} ${lerp(250, 200, growth)} ${200 - lean} ${lerp(220, 170, growth)} ${200 - lean} ${topY}
      L ${200 - lean - tw} ${topY}
      C ${200 - lean - tw} ${lerp(220, 170, growth)} ${198 - tw} ${lerp(250, 200, growth)} ${200 - tw} 302 Z"
      fill="url(#trunkG)"/>`;

  // 솔잎 층(tier): 위는 좁고 아래는 넓은 원뿔형. 자랄수록 층이 늘고 커진다.
  const nTiers = Math.max(1, Math.round(lerp(1, 5, growth)));
  const wBottom = lerp(26, 150, growth);
  const apexX = 200 - lean;
  const baseFoliageY = lerp(250, 206, growth);
  for (let i = 0; i < nTiers; i++) {
    const frac = nTiers > 1 ? i / (nTiers - 1) : 0; // 0=맨위, 1=맨아래
    const y = lerp(topY + 6, baseFoliageY, frac);
    const w = lerp(16, wBottom, frac * frac); // 아래로 갈수록 급히 넓어짐(원뿔)
    const h = w * 0.46;
    const cx = apexX + Math.sin(frac * 3) * lean * 0.4;
    // 층 그림자 → 본체 → 윗면 하이라이트
    s += ell(cx, y + h * 0.5, w, h, needleDark, 0.95);
    s += ell(cx, y, w, h, needle);
    if (growth > 0.5) s += ell(cx - w * 0.18, y - h * 0.3, w * 0.5, h * 0.5, needleLight, ((growth - 0.5) / 0.5 * 0.6).toFixed(2));
    // 솔방울 (아주 건강할 때, 아래쪽 층에)
    if (t > 0.8 && frac > 0.45) {
      const n = Math.round(((t - 0.8) / 0.2) * 3);
      for (let k = 0; k < n; k++) {
        s += ell(cx + (k - 1) * w * 0.5, y + h * 0.2, 4.5, 6.5, "#6e4a24");
      }
    }
  }

  return s;
}

function defs() {
  return `<defs>
    <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4a2c18"/><stop offset="0.5" stop-color="#8a5630"/><stop offset="1" stop-color="#4a2c18"/>
    </linearGradient>
    <radialGradient id="sunG" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff6d8" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

export function svgFor(health) {
  // health(0~100). 구버전 stageId(0~4) 호출 호환.
  let h = health;
  if (health <= 4 && Number.isInteger(health)) {
    h = [8, 27, 50, 73, 96][health] ?? 50;
  }
  return `
    <svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      ${defs()}
      ${svgForHealth(h)}
    </svg>`;
}
