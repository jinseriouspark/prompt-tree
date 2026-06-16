// gen-imagen.mjs — Imagen 4 데모: seed 고정 + 한 요청에 여러 장(sampleCount).
// 사용: GEMINI_API_KEY=... node scripts/gen-imagen.mjs "<prompt>" <count> <seed> <outDir>
// 예:   GEMINI_API_KEY=.. node scripts/gen-imagen.mjs "a lone Korean pine on a hill" 4 42 assets/imagen-test
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGEN_MODEL || "imagen-4.0-generate-001";
const prompt = process.argv[2] || "a single Korean red pine tree on a grassy hill, photorealistic, sunny";
const count = parseInt(process.argv[3] || "4", 10);
const seed = parseInt(process.argv[4] || "42", 10);
const outDir = join(ROOT, process.argv[5] || "assets/imagen-test");
if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }
mkdirSync(outDir, { recursive: true });

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    instances: [{ prompt }],
    parameters: {
      sampleCount: count,   // 한 요청에 여러 장 (1~4)
      aspectRatio: "1:1",
      personGeneration: "dont_allow",
    },
  }),
});
if (!res.ok) { console.error("HTTP", res.status, (await res.text()).slice(0, 300)); process.exit(2); }
const data = await res.json();
const preds = data.predictions || [];
console.log(`받은 이미지: ${preds.length}장 (seed=${seed})`);
preds.forEach((p, i) => {
  const b64 = p.bytesBase64Encoded || p.image?.imageBytes;
  if (!b64) return;
  writeFileSync(join(outDir, `img-${i}.jpg`), Buffer.from(b64, "base64"));
  console.log(`  저장: ${process.argv[5] || "assets/imagen-test"}/img-${i}.jpg`);
});
