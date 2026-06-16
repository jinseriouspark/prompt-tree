// gen-tree-images.mjs — Gemini(나노 바나나) 이미지 모델로 5단계 나무 사진을 만든다.
// 같은 나무 유지를 위해 기준(stage-3)을 먼저 만들고, 그 이미지를 참조로 나머지를 생성.
//
// 실행: GEMINI_API_KEY=... node scripts/gen-tree-images.mjs
// 모델 변경: GEMINI_IMAGE_MODEL=gemini-2.5-flash-image node scripts/gen-tree-images.mjs
// 결과: assets/tree, extension/assets/tree, tree/assets/tree 에 stage-0..4.jpg 저장.

import { writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const API = "https://generativelanguage.googleapis.com/v1beta";

if (!KEY) {
  console.error("환경변수 GEMINI_API_KEY 가 없습니다. (웹 환경 설정 → secret 으로 추가)");
  process.exit(1);
}

const BASE =
  "Photorealistic photograph of a Korean red pine (소나무) growing on the same small grassy mound, " +
  "centered composition, eye-level wide shot, bright sunny day, blue sky with soft clouds, green grass, " +
  "SAME location, SAME background, SAME camera and framing across every image. " +
  "Only the tree's age and SIZE change — it grows bigger and taller step by step.";

// 생성 순서: 기준(3) 먼저 → 그 이미지를 참조로 같은 자리/같은 빛에서 크기만 변화.
const STAGES = [
  [3, "a healthy young pine tree about 3 meters tall, a clearly formed trunk and full green layered needles."],
  [4, "a huge majestic ancient pine (노송), very tall and wide, thick gnarled trunk and broad sprawling layered canopy, towering over the mound."],
  [2, "a small young pine sapling about 1 meter tall, slender trunk, a few small tiers of green needles."],
  [1, "a tiny pine seedling about 25cm tall, a thin stem with a small tuft of needles, just starting out."],
  [0, "a very tiny pine sprout just emerging from the soil, only a few centimeters tall with two or three little needles."],
];

const OUT_DIRS = ["assets/tree", "extension/assets/tree", "tree/assets/tree"].map((p) => join(ROOT, p));
OUT_DIRS.forEach((d) => mkdirSync(d, { recursive: true }));

async function generate(prompt, refB64) {
  const parts = [{ text: prompt }];
  if (refB64) parts.push({ inlineData: { mimeType: "image/jpeg", data: refB64 } });
  const res = await fetch(`${API}/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const cand = data?.candidates?.[0]?.content?.parts || [];
  const img = cand.find((p) => p.inlineData?.data);
  if (!img) throw new Error("응답에 이미지가 없습니다: " + JSON.stringify(data).slice(0, 300));
  return img.inlineData.data; // base64
}

let refB64 = null;
for (const [n, desc] of STAGES) {
  const prompt = `${BASE}\nState: ${desc}`;
  process.stdout.write(`stage-${n} 생성 중 (model=${MODEL})... `);
  try {
    const b64 = await generate(prompt, refB64);
    const buf = Buffer.from(b64, "base64");
    const primary = join(OUT_DIRS[0], `stage-${n}.jpg`);
    writeFileSync(primary, buf);
    OUT_DIRS.slice(1).forEach((d) => copyFileSync(primary, join(d, `stage-${n}.jpg`)));
    if (n === 3) refB64 = b64; // 기준 이미지를 이후 단계 참조로
    console.log("완료");
  } catch (e) {
    console.log("실패\n  " + e.message);
    process.exitCode = 2;
  }
}
console.log("끝. assets/tree, extension/assets/tree, tree/assets/tree 확인.");
