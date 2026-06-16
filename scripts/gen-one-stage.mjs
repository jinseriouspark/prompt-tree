// gen-one-stage.mjs — 특정 단계 한 장만, 기존 stage-3 을 배경 기준으로 재생성.
// 사용: GEMINI_API_KEY=... node scripts/gen-one-stage.mjs <stageN> "<상태 설명>"
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const N = process.argv[2];
const DESC = process.argv[3];
if (!KEY || N == null || !DESC) { console.error("usage: GEMINI_API_KEY=.. node scripts/gen-one-stage.mjs N \"desc\""); process.exit(1); }

const BASE =
  "Photorealistic photograph of a Korean red pine (소나무) growing on the same small grassy mound, " +
  "centered, eye-level wide shot, bright sunny day, blue sky, green grass, SAME location and camera. ";
const parts = [{ text: BASE + DESC }];
if (!process.env.NOREF) {
  const ref = readFileSync(join(ROOT, "assets/tree/stage-3.jpg")).toString("base64");
  parts.push({ inlineData: { mimeType: "image/jpeg", data: ref } });
}
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
});
if (!res.ok) { console.error("HTTP", res.status, (await res.text()).slice(0, 200)); process.exit(2); }
const data = await res.json();
const part = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
if (!part) { console.error("이미지 없음"); process.exit(3); }
const buf = Buffer.from(part.inlineData.data, "base64");
const primary = join(ROOT, `assets/tree/stage-${N}.jpg`);
writeFileSync(primary, buf);
copyFileSync(primary, join(ROOT, `extension/assets/tree/stage-${N}.jpg`));
copyFileSync(primary, join(ROOT, `tree/assets/tree/stage-${N}.jpg`));
console.log(`stage-${N} 재생성 완료`);
