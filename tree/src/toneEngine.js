// toneEngine.js
// 프롬프트 한 문장의 "뉘앙스"를 읽어 점수(-1 ~ +1)로 환산한다.
// 외부 API 없이 로컬 사전 기반. (가볍고 오프라인, 무료)
// "물은 답을 알고 있다" 모티프: 따뜻한 말 → 잘 자라고, 거친 말 → 시든다.

// --- 사전 -----------------------------------------------------------------

// 따뜻함 / 정중함 / 명확한 협업 신호
const KIND = [
  "고마워", "고맙", "감사", "덕분", "부탁", "수고", "괜찮", "천천히",
  "미안", "죄송", "좋아", "좋네", "좋은", "최고", "멋지", "훌륭", "잘했", "잘됐",
  "please", "thanks", "thank you", "thank", "appreciate", "great", "awesome",
  "nice", "good", "well done", "sorry", "could you", "would you", "may i",
];

// 거칠음 / 짜증 / 명령 / 욕설
const RUDE = [
  "짜증", "왜 안", "왜안", "왜 이래", "왜이래", "왜 못", "왜못", "왜 또", "왜또",
  "멍청", "바보", "병신", "ㅂㅅ", "씨발", "시발", "ㅅㅂ", "존나", "졸라", "닥쳐",
  "당장", "빨리", "그냥 해", "그냥해", "똑바로", "제대로 좀", "쓸모", "최악", "구려",
  "답답", "한심", "엉터리", "틀렸잖아", "또 틀", "몇 번을", "몇번을",
  "stupid", "idiot", "dumb", "useless", "garbage", "trash", "damn",
  "shit", "fuck", "wtf", "hurry", "asap now", "you broke", "broken again",
];

// 정중한 한국어 어미 (말끝)
const POLITE_ENDINGS = [
  "주세요", "해주", "해 주", "을까요", "ㄹ까요", "실까요", "겠어요", "겠습니다",
  "습니다", "ㅂ니다", "세요", "에요", "예요", "네요", "어요", "아요", "요?", "요.",
];

// --- 유틸 -----------------------------------------------------------------

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

// 공격성 신호: 느낌표 떼창, 물음표 떼창, 전부 대문자
function aggressionSignals(raw) {
  let agg = 0;
  const bangs = (raw.match(/!/g) || []).length;
  const questions = (raw.match(/\?/g) || []).length;
  if (bangs >= 2) agg += Math.min(bangs - 1, 3);
  if (questions >= 3) agg += 1;

  const letters = raw.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 4 && letters === letters.toUpperCase()) agg += 2;

  // ㅋㅋ 없이 ㅡㅡ, ㅗ, 하... 같은 신경질 신호
  if (/ㅡㅡ|^하+\.\.\.|^아\s|ㅗ/.test(raw)) agg += 1;
  return agg;
}

// --- 메인 -----------------------------------------------------------------

/**
 * @param {string} text 사용자가 AI에게 보낸 프롬프트 원문
 * @returns {{score:number,label:string,emoji:string,reasons:string[]}}
 *   score: -1(거침) ~ +1(따뜻함)
 */
export function analyzeTone(text) {
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

  // -1 ~ +1 로 환산. 신호가 전혀 없으면 살짝 양(+)으로 둔다(차분한 작업도 성장).
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
