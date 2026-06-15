// garden.js
// 나무의 "생명력(health, 0~100)" 상태를 관리한다.
// 프롬프트를 보낼 때마다 톤 점수가 health에 반영된다.
// - 어떤 프롬프트든 약간의 성장(빌드)은 일어난다 ("많이 칠수록 자란다")
// - 다만 따뜻하면 무성하게, 거칠면 시들게 — 톤이 방향을 정한다.

import { analyzeTone } from "./toneEngine.js";

const STORAGE_KEY = "prompt-tree:v1";

const DEFAULT_STATE = {
  health: 50, // 0 죽음 ~ 100 만개
  prompts: 0, // 누적 프롬프트 수
  history: [], // 최근 기록
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
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
  const fresh = { ...DEFAULT_STATE, history: [] };
  saveState(fresh);
  return fresh;
}

/**
 * 프롬프트 한 건을 정원에 적용한다.
 * @returns {{state, tone, delta}}
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

  const next = {
    ...state,
    health: clamp(state.health + delta, 0, 100),
    prompts: state.prompts + 1,
    history: [
      { text, tone, delta, at: Date.now() },
      ...state.history,
    ].slice(0, 30),
  };

  saveState(next);
  return { state: next, tone, delta };
}
