// gen-tree-gallery.mjs — 서식지별 다양한 수종을 도감용으로 생성한다.
// 이미 있는 파일은 건너뛴다. 실행: GEMINI_API_KEY=... node scripts/gen-tree-gallery.mjs
// 결과: assets/trees/<slug>.jpg + assets/trees/index.json (slug, ko/en/zh, habitat)

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const API = "https://generativelanguage.googleapis.com/v1beta";
if (!KEY) { console.error("GEMINI_API_KEY 없음"); process.exit(1); }

const BASE =
  "Photorealistic nature photograph, a single iconic tree as the clear subject, centered composition, " +
  "eye-level wide shot, beautiful natural lighting, highly detailed, 8k, soft depth of field.";

// [slug, 한국어, English, 中文, habitat, 장면 디테일]
const SPECIES = [
  // 숲 forest
  ["maple-autumn","단풍나무","Maple","枫树","forest","blazing red and orange autumn maple, fallen leaves on the ground, crisp golden light"],
  ["white-birch","자작나무","White birch","白桦","forest","slender white-barked birch grove, dappled light, cool forest atmosphere"],
  ["redwood","세쿼이아","Redwood","红杉","forest","towering giant redwood in a misty old-growth forest, sunbeams through fog"],
  ["bamboo","대나무","Bamboo","竹","forest","dense tall green bamboo grove, soft diffused light, serene zen atmosphere"],
  // 초원 grassland / savanna
  ["cherry-blossom","벚나무","Cherry blossom","樱花树","grassland","in full pink bloom, petals drifting in the air, soft spring sunlight, grassy meadow"],
  ["baobab","바오바브나무","Baobab","猴面包树","grassland","massive ancient baobab on an African savanna at sunset, dramatic orange sky"],
  ["umbrella-acacia","우산아카시아","Umbrella acacia","伞形金合欢","grassland","flat-topped umbrella thorn acacia on an African savanna, golden grass, warm light"],
  ["lone-oak","들판의 참나무","Lone oak","孤橡树","grassland","a majestic lone oak in a wide green grassland, big sky with scattered clouds"],
  // 사막 desert
  ["joshua-tree","조슈아트리","Joshua tree","约书亚树","desert","lone Joshua tree in a desert at dusk, vast starry twilight sky"],
  ["saguaro","사구아로 선인장","Saguaro cactus","巨人柱仙人掌","desert","giant saguaro cactus in the Arizona desert, red rock, warm sunset"],
  ["date-palm","대추야자","Date palm","枣椰树","desert","date palm in a desert oasis, sand dunes behind, clear hot sky"],
  ["dragon-blood","용혈수","Dragon blood tree","龙血树","desert","surreal umbrella-shaped dragon blood tree on rocky arid Socotra land"],
  // 밀림 jungle / rainforest
  ["kapok","케이폭나무","Kapok","木棉","jungle","enormous kapok emergent tree towering over a lush green rainforest canopy"],
  ["banyan","반얀나무","Banyan","榕树","jungle","sprawling banyan with many hanging aerial prop roots, dense humid jungle"],
  ["strangler-fig","교살무화과","Strangler fig","绞杀榕","jungle","dramatic strangler fig wrapping a host trunk, deep mossy rainforest"],
  ["rubber-fig","고무나무","Rubber fig","橡胶榕","jungle","large glossy-leaved rubber fig in a tropical jungle, dappled green light"],
  // 물가 wetland
  ["weeping-willow","수양버들","Weeping willow","垂柳","wetland","long draping branches beside a calm lake, gentle reflection, misty morning"],
  ["mangrove","맹그로브","Mangrove","红树林","wetland","mangrove tree with tangled stilt roots in shallow coastal water at low tide"],
  // 해안 coast
  ["palm","야자수","Palm","棕榈树","coast","tall coconut palm on a tropical white-sand beach, turquoise sea, bright sky"],
  // 산 mountain
  ["olive","올리브나무","Olive","橄榄树","mountain","gnarled old olive tree with silvery leaves, Mediterranean hillside, golden hour"],
  ["snowy-pine","설송","Snowy pine","雪松","mountain","snow-covered pine tree in a quiet winter mountain landscape, soft blue light"],
  // 정원 garden
  ["ginkgo","은행나무","Ginkgo","银杏树","garden","brilliant yellow ginkgo in autumn, golden leaves carpeting the ground, blue sky"],
  ["magnolia","목련","Magnolia","玉兰","garden","white magnolia tree heavy with large blossoms, soft overcast spring light"],
  ["jacaranda","자카란다","Jacaranda","蓝花楹","garden","jacaranda tree covered in purple-blue blossoms, petals on the ground, sunny"],
  ["bonsai","분재","Bonsai","盆栽","garden","exquisite miniature pine bonsai in a ceramic pot, minimal studio background"],
  ["sakura-night","밤 벚꽃","Night sakura","夜樱","garden","cherry blossom tree lit up at night, glowing pink against a dark sky, magical"],
];

const OUT = join(ROOT, "assets/trees");
mkdirSync(OUT, { recursive: true });

async function gen(prompt) {
  const res = await fetch(`${API}/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const part = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!part) throw new Error("이미지 없음");
  return part.inlineData.data;
}

const out = [];
for (const [slug, ko, en, zh, habitat, detail] of SPECIES) {
  const file = join(OUT, `${slug}.jpg`);
  if (existsSync(file)) { out.push({ slug, ko, en, zh, habitat }); console.log(`${slug} ... 이미 있음`); continue; }
  process.stdout.write(`${slug} (${habitat}) ... `);
  try {
    const b64 = await gen(`${BASE} Subject: ${en} — ${detail}.`);
    writeFileSync(file, Buffer.from(b64, "base64"));
    out.push({ slug, ko, en, zh, habitat });
    console.log("완료");
  } catch (e) { console.log("실패: " + e.message); }
}
writeFileSync(join(OUT, "index.json"), JSON.stringify(out, null, 2));
console.log(`끝. ${out.length}/${SPECIES.length} 종 → assets/trees/index.json`);
