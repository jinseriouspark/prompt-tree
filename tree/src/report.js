// report.js — 최근 기록(history)을 톤별로 집계해 "내 말투 리포트"를 만든다.
// 무료 미니 버전(= Pro 주간 톤 리포트의 맛보기). 전부 로컬 데이터만 쓴다.

const ORDER = [
  { label: "다정함", emoji: "🌸", color: "#f48fb1", sign: 1 },
  { label: "정중함", emoji: "🌿", color: "#7fbf5a", sign: 1 },
  { label: "담담함", emoji: "🍃", color: "#c9c2b2", sign: 0 },
  { label: "짜증", emoji: "🥀", color: "#d9a05a", sign: -1 },
  { label: "거침", emoji: "🔥", color: "#c0492f", sign: -1 },
];

export const REPORT_ORDER = ORDER;

/**
 * @param {Array} history garden state.history (각 항목 { tone: {label, score} })
 * @returns {{total, segments, posPct, negPct, avgScore, headline}}
 */
export function toneReport(history) {
  const items = history || [];
  const total = items.length;
  const counts = Object.fromEntries(ORDER.map((o) => [o.label, 0]));
  let scoreSum = 0;
  for (const h of items) {
    const lb = h.tone?.label;
    if (lb in counts) counts[lb] += 1;
    scoreSum += h.tone?.score ?? 0;
  }

  const segments = ORDER.map((o) => ({
    ...o,
    count: counts[o.label],
    pct: total ? (counts[o.label] / total) * 100 : 0,
  }));

  const pos = segments.filter((s) => s.sign > 0).reduce((a, s) => a + s.count, 0);
  const neg = segments.filter((s) => s.sign < 0).reduce((a, s) => a + s.count, 0);
  const posPct = total ? Math.round((pos / total) * 100) : 0;
  const negPct = total ? Math.round((neg / total) * 100) : 0;
  const avgScore = total ? scoreSum / total : 0;

  let headline;
  if (!total) headline = "아직 기록이 없어요. 프롬프트를 보내보세요.";
  else if (avgScore >= 0.45) headline = `따뜻한 말투가 ${posPct}% — 나무가 좋아해요 🌸`;
  else if (avgScore >= 0.1) headline = `대체로 정중해요 (긍정 ${posPct}%) 🌿`;
  else if (avgScore > -0.1) headline = "담담한 편이에요. 한마디 더 다정하면 무성해져요 🍃";
  else headline = `거친 말이 ${negPct}% — 나무가 시들고 있어요 🥀`;

  return { total, segments, posPct, negPct, avgScore, headline };
}
