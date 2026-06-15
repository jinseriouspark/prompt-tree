// engine.js — 확장용 톤/정원 엔진 (클래식 스크립트, 콘텐츠 스크립트 isolated world 공유).
// 로직은 웹앱의 src/toneEngine.js + src/garden.js 와 동일하게 유지한다.
// (ES 모듈을 콘텐츠 스크립트에서 직접 못 쓰므로 의도적으로 같은 규칙을 복제)

const KIND = [
  "고마워", "고맙", "감사", "덕분", "부탁", "수고", "괜찮", "천천히",
  "미안", "죄송", "좋아", "좋네", "좋은", "최고", "멋지", "훌륭", "잘했", "잘됐",
  "please", "thanks", "thank you", "thank", "appreciate", "great", "awesome",
  "nice", "good", "well done", "sorry", "could you", "would you", "may i",
];

const RUDE = [
  "짜증", "왜 안", "왜안", "왜 이래", "왜이래", "왜 못", "왜못", "왜 또", "왜또",
  "멍청", "바보", "병신", "ㅂㅅ", "씨발", "시발", "ㅅㅂ", "존나", "졸라", "닥쳐",
  "당장", "빨리", "그냥 해", "그냥해", "똑바로", "제대로 좀", "쓸모", "최악", "구려",
  "답답", "한심", "엉터리", "틀렸잖아", "또 틀", "몇 번을", "몇번을",
  "stupid", "idiot", "dumb", "useless", "garbage", "trash", "damn",
  "shit", "fuck", "wtf", "hurry", "asap now", "you broke", "broken again",
];

const POLITE_ENDINGS = [
  "주세요", "해주", "해 주", "을까요", "ㄹ까요", "실까요", "겠어요", "겠습니다",
  "습니다", "ㅂ니다", "세요", "에요", "예요", "네요", "어요", "아요", "요?", "요.",
];

function countHits(haystack, needles) {
  let n = 0;
  for (const w of needles) {
    let idx = haystack.indexOf(w);
    while (idx !== -1) {
      n += 1;
      idx = haystack.indexOf(w, idx + w.length);
    }
  }
  return n;
}

function aggressionSignals(raw) {
  let agg = 0;
  const bangs = (raw.match(/!/g) || []).length;
  const questions = (raw.match(/\?/g) || []).length;
  if (bangs >= 2) agg += Math.min(bangs - 1, 3);
  if (questions >= 3) agg += 1;
  const letters = raw.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 4 && letters === letters.toUpperCase()) agg += 2;
  if (/ㅡㅡ|^하+\.\.\.|^아\s|ㅗ/.test(raw)) agg += 1;
  return agg;
}

function analyzeTone(text) {
  const raw = (text || "").trim();
  const low = raw.toLowerCase();
  const reasons = [];
  const kind = countHits(low, KIND);
  const polite = countHits(raw, POLITE_ENDINGS);
  const rude = countHits(low, RUDE);
  const agg = aggressionSignals(raw);
  const positive = kind * 1.0 + polite * 0.6;
  const negative = rude * 1.4 + agg * 1.0;
  if (kind) reasons.push(`따뜻한 말 ${kind}`);
  if (polite) reasons.push(`정중한 말투 ${polite}`);
  if (rude) reasons.push(`거친 말 ${rude}`);
  if (agg) reasons.push(`짜증 신호 ${agg}`);
  let score;
  if (positive + negative === 0) {
    score = 0.1;
    reasons.push("담담한 프롬프트");
  } else {
    score = (positive - negative) / (positive + negative);
  }
  score = Math.max(-1, Math.min(1, score));
  let label, emoji;
  if (score >= 0.55) { label = "다정함"; emoji = "🌸"; }
  else if (score >= 0.15) { label = "정중함"; emoji = "🌿"; }
  else if (score > -0.15) { label = "담담함"; emoji = "🍃"; }
  else if (score > -0.55) { label = "짜증"; emoji = "🥀"; }
  else { label = "거침"; emoji = "🔥"; }
  return { score, label, emoji, reasons };
}

// --- 정원 상태 -------------------------------------------------------------

function stageFromHealth(health) {
  if (health <= 15) return { id: 0, name: "고사목", emoji: "🪵" };
  if (health <= 38) return { id: 1, name: "시드는 나무", emoji: "🥀" };
  if (health <= 61) return { id: 2, name: "평범한 나무", emoji: "🌿" };
  if (health <= 84) return { id: 3, name: "건강한 나무", emoji: "🌳" };
  return { id: 4, name: "만개한 나무", emoji: "🌸" };
}

// 레벨(1~100) + 세밀한 단계 이름 (웹앱 tree.js 와 동일 규칙)
const LEVEL_NAMES = [
  [0, "고사목", "🪵"], [9, "마른 가지", "🥀"], [17, "겨우 버티는 나무", "🍂"],
  [25, "새순", "🌱"], [34, "어린 나무", "🌿"], [43, "푸른 기운", "🌿"],
  [52, "평범한 나무", "🌳"], [61, "우거지는 나무", "🌳"], [70, "무성한 그늘", "🌳"],
  [79, "싱그러운 나무", "🌲"], [88, "봉오리 맺힌 나무", "🌸"], [95, "만개한 나무", "🌸"],
];

function levelInfo(health) {
  const h = Math.max(0, Math.min(100, health));
  let name = LEVEL_NAMES[0][1], emoji = LEVEL_NAMES[0][2];
  for (const [min, nm, em] of LEVEL_NAMES) {
    if (h >= min) { name = nm; emoji = em; }
  }
  return { level: Math.round(h), name, emoji, id: stageFromHealth(h).id };
}

// state 에 톤을 적용한 새 상태와 delta 를 돌려준다(순수 함수).
function applyTone(state, text) {
  const tone = analyzeTone(text);
  const BASE_GROWTH = 3;
  let delta;
  if (tone.score >= 0) delta = BASE_GROWTH + tone.score * 13;
  else delta = tone.score * 17;
  delta = Math.round(delta);
  const health = Math.max(0, Math.min(100, (state.health ?? 50) + delta));
  return {
    tone,
    delta,
    next: { ...state, health, prompts: (state.prompts || 0) + 1 },
  };
}
