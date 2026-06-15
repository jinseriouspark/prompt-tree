// garden.js
// 나무의 "생명력(health, 0~100)" 상태를 관리한다.
// 프롬프트를 보낼 때마다 톤 점수가 health에 반영된다.
// - 어떤 프롬프트든 약간의 성장(빌드)은 일어난다 ("많이 칠수록 자란다")
// - 다만 따뜻하면 무성하게, 거칠면 시들게 — 톤이 방향을 정한다.
// 스트릭(연속 사용일)과 뱃지(성취)도 함께 관리한다. 전부 로컬 저장.

import { analyzeTone } from "./toneEngine.js";
import { newlyEarned } from "./badges.js";

const STORAGE_KEY = "prompt-tree:v1";

const DEFAULT_STATE = {
  health: 50, // 0 죽음 ~ 100 만개
  prompts: 0, // 누적 프롬프트 수
  history: [], // 최근 기록
  streak: 0, // 연속 사용 일수
  bestStreak: 0, // 최고 연속 기록
  lastDay: null, // 마지막으로 돌본 날 (YYYY-MM-DD)
  badges: [], // 획득한 뱃지 id 목록
  _wasDying: false, // 고사 직전(15 이하)을 겪었는지 (회생 뱃지용)
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// 로컬 날짜 키 (YYYY-MM-DD). UTC가 아니라 사용자 기준 하루.
function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(aKey, bKey) {
  const a = new Date(aKey + "T00:00:00");
  const b = new Date(bKey + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage 사용 불가 시 무시 */
  }
}

export function resetState() {
  const fresh = { ...DEFAULT_STATE, history: [], badges: [] };
  saveState(fresh);
  return fresh;
}

// 오늘 기준 스트릭을 갱신한 값을 돌려준다(상태는 변경하지 않음).
function nextStreak(state, today) {
  if (state.lastDay === today) return state.streak; // 같은 날 → 유지
  if (state.lastDay && daysBetween(state.lastDay, today) === 1) {
    return state.streak + 1; // 어제 했으면 연속 +1
  }
  return 1; // 그 외(첫날/끊김) → 1부터
}

/**
 * 프롬프트 한 건을 정원에 적용한다.
 * @returns {{state, tone, delta, newBadges:string[]}}
 */
export function applyPrompt(state, text) {
  const tone = analyzeTone(text);

  // 기본 성장 + 톤 가중. 효과를 "눈에 띄게" 과장한다(몰입 핵심).
  const BASE_GROWTH = 3; // 어떤 프롬프트든 기본 성장
  let delta;
  if (tone.score >= 0) {
    delta = BASE_GROWTH + tone.score * 13; // 최대 +16
  } else {
    delta = tone.score * 17; // 최대 -17 (기본 성장도 못 이기고 시든다)
  }
  delta = Math.round(delta);

  const today = dayKey();
  const streak = nextStreak(state, today);
  const health = clamp(state.health + delta, 0, 100);

  const next = {
    ...state,
    health,
    prompts: state.prompts + 1,
    streak,
    bestStreak: Math.max(state.bestStreak || 0, streak),
    lastDay: today,
    _wasDying: state._wasDying || health <= 15,
    history: [
      { text, tone, delta, at: Date.now() },
      ...state.history,
    ].slice(0, 30),
  };

  // 새로 획득한 뱃지 평가 → 상태에 반영
  const newBadges = newlyEarned(next, { tone, delta });
  if (newBadges.length) next.badges = [...(next.badges || []), ...newBadges];

  saveState(next);
  return { state: next, tone, delta, newBadges };
}
