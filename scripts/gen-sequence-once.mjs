// gen-sequence-once.mjs — 한 번의 요청으로 "같은 나무"의 성장 5단계를 한 세트로 생성.
// 한 생성 안에서 나오므로 나무 정체성이 일관된다(별도 seed 불필요).
// 실행: GEMINI_API_KEY=... node scripts/gen-sequence-once.mjs
import { writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }

const PROMPT =
  "Generate FIVE separate photorealistic images as one consistent set: the SAME single Korean red pine " +
  "tree (소나무) growing on the SAME small grassy mound, SAME sunny day, SAME blue sky, SAME camera and " +
  "framing in every image. The ONLY thing that changes is the tree's age and size — it grows bigger each step:\n" +
  "1) a tiny baby pine sprout, only a few centimeters, alone on the mound (no big tree);\n" +
  "2) a small sapling about half a meter tall;\n" +
  "3) a young pine about 2 meters tall;\n" +
  "4) a large mature pine;\n" +
  "5) a huge majestic ancient pine (노송) towering over the mound.\n" +
  "Output the five images in this exact order, same identity and background throughout.";

async function call() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: PROMPT }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

let data;
for (let i = 1; i <= 6; i++) {
  try { data = await call(); break; }
  catch (e) { console.log(`시도 ${i} 실패: ${e.message}`); if (i === 6) process.exit(2); await new Promise(r => setTimeout(r, i * 8000)); }
}

const parts = data?.candidates?.[0]?.content?.parts || [];
const imgs = parts.filter((p) => p.inlineData?.data).map((p) => p.inlineData.data);
console.log(`응답 이미지 수: ${imgs.length}`);
if (!imgs.length) { console.error("이미지 없음:", JSON.stringify(data).slice(0, 300)); process.exit(3); }

const dirs = ["assets/tree", "extension/assets/tree", "tree/assets/tree"].map((d) => join(ROOT, d));
dirs.forEach((d) => mkdirSync(d, { recursive: true }));
imgs.slice(0, 5).forEach((b64, n) => {
  const primary = join(dirs[0], `stage-${n}.jpg`);
  writeFileSync(primary, Buffer.from(b64, "base64"));
  dirs.slice(1).forEach((d) => copyFileSync(primary, join(d, `stage-${n}.jpg`)));
  console.log(`stage-${n} 저장`);
});
console.log(`끝. ${Math.min(imgs.length, 5)}장 저장.`);
