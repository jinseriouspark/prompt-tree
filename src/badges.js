// badges.js — 성취 뱃지 정의 + 평가.
// 모두 로컬 상태(garden)만으로 판정한다(서버/외부 전송 없음).
// 뱃지는 재방문·습관화를 위한 바이럴/리텐션 장치다.

export const BADGES = [
  {
    id: "first-sprout",
    name: "첫 새싹",
    emoji: "🌱",
    desc: "첫 프롬프트를 보냈다.",
    earned: (s) => s.prompts >= 1,
  },
  {
    id: "kind-soul",
    name: "다정한 손길",
    emoji: "🌸",
    desc: "다정한 톤(🌸)으로 말했다.",
    earned: (s, ctx) => ctx?.tone?.label === "다정함",
  },
  {
    id: "gardener",
    name: "정원사",
    emoji: "🧑‍🌾",
    desc: "프롬프트 25개를 보냈다.",
    earned: (s) => s.prompts >= 25,
  },
  {
    id: "full-bloom",
    name: "만개",
    emoji: "🌳",
    desc: "나무를 만개(생명력 85+)시켰다.",
    earned: (s) => s.health >= 85,
  },
  {
    id: "comeback",
    name: "회생",
    emoji: "💧",
    desc: "고사 직전(15 이하)에서 다시 평범(62+)까지 살려냈다.",
    earned: (s) => s._wasDying === true && s.health >= 62,
  },
  {
    id: "streak-3",
    name: "3일 연속",
    emoji: "🔥",
    desc: "3일 연속 나무를 돌봤다.",
    earned: (s) => s.streak >= 3,
  },
  {
    id: "streak-7",
    name: "한 주 정원",
    emoji: "🏆",
    desc: "7일 연속 나무를 돌봤다.",
    earned: (s) => s.streak >= 7,
  },
  {
    id: "centurion",
    name: "백 번의 말",
    emoji: "💯",
    desc: "프롬프트 100개를 보냈다.",
    earned: (s) => s.prompts >= 100,
  },
];

const byId = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export function badgeById(id) {
  return byId[id];
}

/**
 * 현재 상태에서 새로 획득한 뱃지 id 목록을 돌려준다.
 * @param {object} state 적용 후 상태 (state.badges = 이미 가진 id 배열)
 * @param {object} ctx   { tone, delta } 직전 프롬프트 컨텍스트
 */
export function newlyEarned(state, ctx) {
  const have = new Set(state.badges || []);
  const fresh = [];
  for (const b of BADGES) {
    if (!have.has(b.id) && b.earned(state, ctx)) fresh.push(b.id);
  }
  return fresh;
}
