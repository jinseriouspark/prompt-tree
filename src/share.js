// share.js — "내 나무" 공유 카드(이미지) 생성. 바이럴 1순위 장치.
// 전부 클라이언트(canvas)에서 그린다. 서버/외부 전송 없음.
// 나무 사진(stage-N.jpg)이 있으면 그걸, 없으면 SVG 나무를 래스터화해서 쓴다.

import { svgFor, levelInfo } from "./skins/tree.js";
import { PRODUCT } from "./config.js";

const W = 1080;
const H = 1350; // 4:5 세로 (인스타/스토리 친화)

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 나무 비주얼을 Image 로 확보한다: 사진 우선, 실패 시 SVG 폴백.
async function treeImage(stage, health) {
  try {
    return await loadImage(stage.photo + "?v=1");
  } catch {
    const svg = svgFor(health); // health 기반 연속 SVG (defs 포함 완전한 svg)
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return loadImage(url);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const STAGE_COLOR = {
  0: "#6b5b4a",
  1: "#b08b3e",
  2: "#6f9d5a",
  3: "#3f8a35",
  4: "#e0689f",
};

/**
 * 현재 상태로 공유 카드를 그려 PNG Blob 을 돌려준다.
 * @param {object} opts { stage, state }
 */
export async function buildShareCard({ stage, state }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 배경
  ctx.fillStyle = "#faf8f3";
  ctx.fillRect(0, 0, W, H);

  // 상단 타이틀
  ctx.fillStyle = "#14130f";
  ctx.textAlign = "left";
  ctx.font = "300 60px -apple-system, 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText("프롬프트", 80, 130);
  ctx.font = "800 60px -apple-system, 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText("나무", 80 + ctx.measureText("프롬프트 ").width, 130);

  // 나무 이미지 (둥근 카드 안에 cover)
  const cardX = 80, cardY = 180, cardW = W - 160, cardH = 720;
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = "#eef1ec";
  ctx.fill();
  ctx.clip();
  const img = await treeImage(stage, state.health);
  // object-fit: cover 계산
  const ir = img.width / img.height;
  const cr = cardW / cardH;
  let dw, dh, dx, dy;
  if (ir > cr) {
    dh = cardH; dw = cardH * ir; dx = cardX - (dw - cardW) / 2; dy = cardY;
  } else {
    dw = cardW; dh = cardW / ir; dx = cardX; dy = cardY - (dh - cardH) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  // 레벨 + 단계 이름
  const lv = levelInfo(state.health);
  const accent = STAGE_COLOR[stage.id] || "#3f8a35";
  ctx.textAlign = "left";
  ctx.fillStyle = "#14130f";
  ctx.font = "800 64px -apple-system, 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText(`Lv.${lv.level} · ${lv.name}`, 80, 1010);

  // 생명력 바
  const barX = 80, barY = 1050, barW = W - 160, barH = 26;
  roundRect(ctx, barX, barY, barW, barH, 13);
  ctx.fillStyle = "#ece8dd";
  ctx.fill();
  const fillW = Math.max(barH, (barW * state.health) / 100);
  roundRect(ctx, barX, barY, fillW, barH, 13);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = "#6f6a60";
  ctx.font = "500 34px -apple-system, 'Apple SD Gothic Neo', sans-serif";
  ctx.fillText(`생명력 ${Math.round(state.health)} / 100`, 80, 1130);

  // 통계 (프롬프트 수 · 스트릭)
  ctx.fillStyle = "#14130f";
  ctx.font = "700 40px -apple-system, 'Apple SD Gothic Neo', sans-serif";
  const stats = `🌱 ${state.prompts}개   🔥 ${state.streak}일 연속`;
  ctx.fillText(stats, 80, 1200);

  // 푸터
  ctx.fillStyle = "#6f6a60";
  ctx.font = "500 30px -apple-system, sans-serif";
  ctx.fillText(`${PRODUCT.url}  ·  ${PRODUCT.handle}`, 80, 1290);

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
}

// 공유: Web Share(파일) 지원 시 시스템 공유, 아니면 다운로드 폴백.
export async function shareCard(blob, { stage, state }) {
  const file = new File([blob], "prompt-tree.png", { type: "image/png" });
  const text = `내 프롬프트 나무: ${stage.name} (생명력 ${Math.round(
    state.health
  )}/100, ${state.streak}일 연속) 🌳`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: "프롬프트 나무" });
      return "shared";
    } catch {
      /* 사용자가 취소 → 다운로드로 폴백하지 않고 종료 */
      return "cancelled";
    }
  }

  // 폴백: 다운로드
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt-tree.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
