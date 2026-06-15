// skins/tree.js
// "스킨" = health(0~100)를 하나의 비주얼로 표현하는 모듈.
// 톤 엔진과 분리되어 있어, 나중에 식물/물결정/펫 스킨을 같은 방식으로 추가 가능.
//
// 우선순위: assets/tree/stage-N.jpg (극사실주의 사진) 이 있으면 사용,
//          없으면 inline SVG 나무로 폴백한다.

export const STAGES = [
  {
    id: 0,
    name: "고사목",
    caption: "말라 죽었다. 거친 말이 양분을 다 빼앗았다.",
    photo: "assets/tree/stage-0.jpg",
  },
  {
    id: 1,
    name: "시드는 나무",
    caption: "잎이 마르고 있다. 톤을 바꾸면 아직 살릴 수 있다.",
    photo: "assets/tree/stage-1.jpg",
  },
  {
    id: 2,
    name: "평범한 나무",
    caption: "그럭저럭 버틴다. 조금 더 다정하면 무성해진다.",
    photo: "assets/tree/stage-2.jpg",
  },
  {
    id: 3,
    name: "건강한 나무",
    caption: "잎이 무성하다. 좋은 프롬프트가 키운 결과다.",
    photo: "assets/tree/stage-3.jpg",
  },
  {
    id: 4,
    name: "만개한 나무",
    caption: "꽃이 활짝 폈다. 당신의 말이 이렇게 자랐다.",
    photo: "assets/tree/stage-4.jpg",
  },
];

export function stageFromHealth(health) {
  if (health <= 15) return STAGES[0];
  if (health <= 38) return STAGES[1];
  if (health <= 61) return STAGES[2];
  if (health <= 84) return STAGES[3];
  return STAGES[4];
}

// --- SVG 폴백 -------------------------------------------------------------
// 사진이 아직 없을 때 보여줄 단계별 나무. 사진이 들어오면 자동으로 가려진다.

function leaf(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />`;
}

function canopy(stageId) {
  // 단계별로 잎의 색/밀도/꽃을 바꾼다.
  const cx = 200, cy = 170;
  if (stageId === 0) {
    // 죽음: 잎 없음, 앙상한 가지
    return `
      <path d="M200 300 L200 150 M200 200 L150 150 M200 210 L255 160 M200 170 L165 120 M200 175 L245 125"
            stroke="#6b5b4a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  }
  if (stageId === 1) {
    // 시듦: 갈색/노란 잎 몇 개
    const c = "#b08b3e";
    return `
      <path d="M200 300 L200 150 M200 200 L150 155 M200 200 L252 160" stroke="#7a6a55" stroke-width="8" fill="none" stroke-linecap="round"/>
      ${leaf(160, 150, 26, c)}${leaf(240, 158, 24, "#9c7b34")}${leaf(205, 120, 30, c)}`;
  }
  if (stageId === 2) {
    const c = "#5f8f4e";
    return `
      ${leaf(cx, cy, 70, c)}${leaf(cx - 55, cy + 15, 45, "#6f9d5a")}${leaf(cx + 55, cy + 15, 45, "#6f9d5a")}`;
  }
  if (stageId === 3) {
    const c = "#3f8a35";
    return `
      ${leaf(cx, cy - 10, 85, c)}${leaf(cx - 70, cy + 20, 55, "#4d9b41")}${leaf(cx + 70, cy + 20, 55, "#4d9b41")}
      ${leaf(cx, cy + 45, 60, "#357a2c")}`;
  }
  // 4: 만개 — 풍성한 초록 + 분홍 꽃
  return `
    ${leaf(cx, cy - 15, 95, "#3f8a35")}${leaf(cx - 78, cy + 18, 60, "#4d9b41")}${leaf(cx + 78, cy + 18, 60, "#4d9b41")}
    ${leaf(cx, cy + 50, 66, "#357a2c")}
    ${leaf(cx - 40, cy - 40, 12, "#f7b6d2")}${leaf(cx + 30, cy - 30, 12, "#f9c8de")}
    ${leaf(cx + 60, cy + 10, 12, "#f7b6d2")}${leaf(cx - 60, cy + 25, 12, "#f9c8de")}
    ${leaf(cx, cy - 70, 12, "#f7b6d2")}${leaf(cx + 10, cy + 60, 12, "#f9c8de")}`;
}

export function svgFor(stageId) {
  const sky = stageId <= 1 ? "#cfcabf" : stageId === 2 ? "#dfeaf2" : "#cfe8ff";
  const ground = stageId <= 1 ? "#b9ad93" : "#7fae5f";
  return `
    <svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="400" height="360" fill="${sky}"/>
      <rect y="300" width="400" height="60" fill="${ground}"/>
      <rect x="192" y="190" width="16" height="120" rx="4" fill="#6b5135"/>
      ${canopy(stageId)}
    </svg>`;
}
