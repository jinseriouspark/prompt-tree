// gen-strip.mjs — 한 장의 가로 필름스트립에 "같은 나무"의 성장 5단계를 그린다.
// 한 생성이라 정체성/배경이 완전히 일관됨. CSS 스프라이트로 단계 전환 가능.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }

const PROMPT =
  "A wide panoramic filmstrip image, aspect ratio about 5:1, divided into FIVE equal square panels " +
  "side by side with thin clean separators. All five panels show the SAME single Korean red pine tree " +
  "(소나무) on the SAME grassy mound, SAME sunny day, SAME blue sky and SAME camera — growing larger " +
  "from left to right: panel 1 a tiny sprout, panel 2 a small sapling, panel 3 a young tree, " +
  "panel 4 a large mature pine, panel 5 a huge ancient pine. Same identity and background in every panel. " +
  "Photorealistic.";

async function call() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: PROMPT }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}
let data;
for (let i = 1; i <= 6; i++) { try { data = await call(); break; } catch (e) { console.log(`시도 ${i}: ${e.message}`); if (i === 6) process.exit(2); await new Promise(r => setTimeout(r, i * 8000)); } }
const part = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
if (!part) { console.error("이미지 없음"); process.exit(3); }
mkdirSync(join(ROOT, "assets/tree"), { recursive: true });
writeFileSync(join(ROOT, "assets/tree/growth-strip.jpg"), Buffer.from(part.inlineData.data, "base64"));
console.log("저장: assets/tree/growth-strip.jpg");
