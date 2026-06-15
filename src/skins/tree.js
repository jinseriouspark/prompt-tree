// skins/tree.js
// "스킨" = 생명력(0~100)을 하나의 비주얼로 표현하는 모듈.
// 나무는 5단계로 뚝뚝 끊기지 않고 health 에 따라 "연속적으로" 자란다(사실상 Lv.1~100).
// 하늘·땅·잎 색, 캐노피 크기, 꽃·나비까지 health 의 함수로 매끄럽게 보간한다.
//
// 사진(stage-N.jpg)은 5단계 폴백 슬롯으로 유지하고, 사진이 없으면 연속 SVG 를 쓴다.

export const STAGES = [
  { id: 0, name: "고사목", caption: "말라 죽었다. 거친 말이 양분을 다 빼앗았다.", photo: "assets/tree/stage-0.jpg" },
  { id: 1, name: "시드는 나무", caption: "잎이 마르고 있다. 톤을 바꾸면 아직 살릴 수 있다.", photo: "assets/tree/stage-1.jpg" },
  { id: 2, name: "평범한 나무", caption: "그럭저럭 버틴다. 조금 더 다정하면 무성해진다.", photo: "assets/tree/stage-2.jpg" },
  { id: 3, name: "건강한 나무", caption: "잎이 무성하다. 좋은 프롬프트가 키운 결과다.", photo: "assets/tree/stage-3.jpg" },
  { id: 4, name: "만개한 나무", caption: "꽃이 활짝 폈다. 당신의 말이 이렇게 자랐다.", photo: "assets/tree/stage-4.jpg" },
];

export function stageFromHealth(health) {
  if (health <= 15) return STAGES[0];
  if (health <= 38) return STAGES[1];
  if (health <= 61) return STAGES[2];
  if (health <= 84) return STAGES[3];
  return STAGES[4];
}

// --- 레벨(1~100) + 세밀한 단계 이름 --------------------------------------
// health 1점마다 레벨이 오른다. 이름은 ~12단계로 나눠 자주 바뀌게 한다.

const LEVEL_NAMES = [
  [0, "고사목", "🪵"],
  [9, "마른 가지", "🥀"],
  [17, "겨우 버티는 나무", "🍂"],
  [25, "새순", "🌱"],
  [34, "어린 나무", "🌿"],
  [43, "푸른 기운", "🌿"],
  [52, "평범한 나무", "🌳"],
  [61, "우거지는 나무", "🌳"],
  [70, "무성한 그늘", "🌳"],
  [79, "싱그러운 나무", "🌲"],
  [88, "봉오리 맺힌 나무", "🌸"],
  [95, "만개한 나무", "🌸"],
];

export function levelInfo(health) {
  const h = Math.max(0, Math.min(100, health));
  const level = Math.round(h); // Lv.0 ~ Lv.100
  let name = LEVEL_NAMES[0][1];
  let emoji = LEVEL_NAMES[0][2];
  for (const [min, nm, em] of LEVEL_NAMES) {
    if (h >= min) { name = nm; emoji = em; }
  }
  return { level, name, emoji, stage: stageFromHealth(h) };
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
// stops: [[pos,hex], ...] (pos 0~1 오름차순) → t 위치의 색
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
const LEAF = [[0.15, "#9c7b34"], [0.3, "#b08b3e"], [0.45, "#7f9a3a"], [0.6, "#4f8f3f"], [1, "#2f7a2a"]];

function blob(cx, cy, rx, ry, fill, op = 1) {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" opacity="${op}"/>`;
}

const BLOSSOM_SPOTS = [
  [160, 112, "#f9a8cf"], [232, 106, "#ffd1e6"], [122, 152, "#f9a8cf"], [282, 152, "#ffd1e6"],
  [200, 98, "#ffffff"], [176, 168, "#f9a8cf"], [250, 174, "#ffd1e6"], [200, 150, "#ffffff"],
  [150, 200, "#f9a8cf"], [262, 204, "#ffd1e6"], [138, 120, "#ffffff"], [266, 124, "#f9a8cf"],
];

/**
 * 생명력(0~100)으로 연속적인 나무 장면을 그린다.
 */
export function svgForHealth(health) {
  const t = Math.max(0, Math.min(1, health / 100));
  const skyTop = multiStop(SKY_TOP, t);
  const skyBot = multiStop(SKY_BOT, t);
  const ground = multiStop(GROUND, t);
  const leafC = multiStop(LEAF, t);
  const leafDark = lerpHex(leafC, "#1f5a1c", 0.35);

  let s = `<rect width="400" height="360" fill="url(#sky)"/>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBot}"/>
    </linearGradient>`;

  // 폭풍 구름(낮은 t) / 부드러운 구름(중간) / 황금 햇살(높은 t)
  if (t < 0.18) {
    s += `<ellipse cx="120" cy="58" rx="78" ry="26" fill="#2c3036" opacity="${(0.7 * (1 - t / 0.18)).toFixed(2)}"/>
      <ellipse cx="270" cy="46" rx="86" ry="28" fill="#2c3036" opacity="${(0.6 * (1 - t / 0.18)).toFixed(2)}"/>`;
  } else if (t > 0.6) {
    const sunGlow = t > 0.88 ? 150 : 90;
    s += `<circle cx="304" cy="78" r="${sunGlow}" fill="url(#sunG)"/>
      <circle cx="304" cy="78" r="${t > 0.88 ? 34 : 24}" fill="${t > 0.88 ? "#fff2c4" : "#fff4cf"}"/>`;
    if (t > 0.88) {
      s += `<g stroke="#ffe9a8" stroke-width="3" opacity="${(0.5 * (t - 0.88) / 0.12).toFixed(2)}">
        <line x1="304" y1="78" x2="180" y2="210"/><line x1="304" y1="78" x2="250" y2="240"/>
        <line x1="304" y1="78" x2="120" y2="150"/></g>`;
    }
    if (t > 0.45 && t <= 0.88) {
      s += `<ellipse cx="110" cy="70" rx="44" ry="18" fill="#fff" opacity="0.8"/>`;
    }
  }

  // 땅 + 그림자
  s += `<path d="M0 300 Q200 286 400 300 L400 360 L0 360 Z" fill="${ground}"/>`;
  s += `<ellipse cx="200" cy="306" rx="${lerp(70, 130, t).toFixed(0)}" ry="12" fill="#000" opacity="${lerp(0.2, 0.12, t).toFixed(2)}"/>`;

  // 줄기 (t 에 따라 살짝 두꺼워짐)
  const tw = lerp(5, 10, t);
  s += `<path d="M${200 - tw} 304 Q${202 - tw} 230 ${198 - tw / 2} 178 L${202 + tw / 2} 178 Q${198 + tw} 230 ${200 + tw} 304 Z" fill="url(#trunkG)"/>`;

  // 캐노피 vs 앙상한 가지
  const canopy = Math.max(0, Math.min(1, (t - 0.12) / 0.88)); // 0~1
  if (canopy <= 0.001) {
    // 죽음/직전: 앙상한 가지 + 낙엽
    s += `<g stroke="#5a4632" stroke-width="6" fill="none" stroke-linecap="round">
      <path d="M198 180 L150 130 M170 156 L140 150 M202 184 L252 132 M232 156 L262 150 M200 170 L200 120 M200 130 L176 96 M200 130 L226 100"/></g>`;
    s += blob(150, 320, 9, 4, "#6b5b3a") + blob(255, 326, 8, 3, "#6b5b3a") + blob(110, 332, 7, 3, "#5e4f33");
  } else {
    // 가지(캐노피 뒤)
    s += `<g stroke="${leafDark}" stroke-width="${lerp(4, 7, canopy).toFixed(1)}" fill="none" stroke-linecap="round" opacity="0.9">
      <path d="M198 182 L${lerp(180, 150, canopy).toFixed(0)} ${lerp(160, 138, canopy).toFixed(0)} M202 184 L${lerp(220, 252, canopy).toFixed(0)} ${lerp(160, 142, canopy).toFixed(0)} M200 176 L200 ${lerp(150, 120, canopy).toFixed(0)}"/></g>`;

    const R = lerp(26, 104, canopy); // 중앙 캐노피 반경
    const cy = lerp(168, 150, canopy);
    s += blob(200 - R * 0.66, lerp(184, 176, canopy), R * 0.62, R * 0.56, leafC);
    s += blob(200 + R * 0.66, lerp(184, 176, canopy), R * 0.62, R * 0.56, leafC);
    s += blob(200, lerp(190, 198, canopy), R * 0.72, R * 0.58, leafDark, 0.95);
    s += blob(200, cy, R, R * 0.84, leafC); // 중앙 캐노피
    s += blob(200, cy - R * 0.2, R * 0.95, R * 0.7, "url(#leafG)"); // 위쪽 광택

    // 하이라이트(건강할수록)
    if (canopy > 0.55) {
      const hop = ((canopy - 0.55) / 0.45) * 0.7;
      s += blob(200 - R * 0.28, 150 - R * 0.25, R * 0.26, R * 0.2, "#9bdc7e", hop.toFixed(2))
        + blob(200 + R * 0.34, 156 - R * 0.18, R * 0.2, R * 0.15, "#9bdc7e", (hop * 0.8).toFixed(2));
    }

    // 꽃(아주 건강할 때부터 점점 많이)
    if (t > 0.82) {
      const count = Math.round(((t - 0.82) / 0.18) * BLOSSOM_SPOTS.length);
      for (let i = 0; i < count && i < BLOSSOM_SPOTS.length; i++) {
        const [x, y, c] = BLOSSOM_SPOTS[i];
        s += blob(x, y, 11, 11, c, 0.95);
      }
      if (t > 0.9) {
        s += blob(150, 322, 6, 3, "#f9a8cf") + blob(255, 328, 6, 3, "#ffd1e6");
        s += `<g opacity="0.95"><path d="M324 132 q-10 -10 -2 -14 q8 4 4 14 q10 -10 2 -14 q-8 4 -4 14" fill="#ff8fc0"/></g>`;
        s += `<g opacity="0.9"><path d="M96 184 q-8 -8 -1 -11 q6 3 3 11 q8 -8 1 -11 q-6 3 -3 11" fill="#ffb3d6"/></g>`;
      }
    }
  }

  return s;
}

function defs() {
  return `<defs>
    <linearGradient id="leafG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4a371f"/><stop offset="0.5" stop-color="#7a5a36"/><stop offset="1" stop-color="#4a371f"/>
    </linearGradient>
    <radialGradient id="sunG" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff6d8" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

export function svgFor(health) {
  // 인자로 health(0~100)를 받는다. (구버전 stageId 호출과의 호환을 위해
  // 0~4 의 작은 값이 들어오면 단계 대표 health 로 변환한다.)
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
