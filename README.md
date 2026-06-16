# 프롬프트트리 (Prompt Tree)

> 정한 시간을 넘기면 화면을 **자라는 나무**로 덮어 쉬게 하는 스크린타임 도구.

쉬는 동안 묘목이 노송(老松)으로 자라고, 다 자라면 화면이 다시 열린다.
**바이브코딩(AI)** 과 **소셜 미디어** 를 따로 지킬 수 있고, 모든 기록은 기기 안에만 저장된다.

- 웹: https://jinseriouspark.github.io/prompt-tree/
- 확장 설치 안내: https://jinseriouspark.github.io/prompt-tree/extension/

## 구성
- **웹 (루트)** — 소개 + **차단 화면 체험** + **나무 도감(서식지별 26종)**, 한·영·중 지원
- **확장 (`extension/`)** — 실제 스크린타임 게이트키퍼 (크롬·파이어폭스)
- **블로그 (`/blog/`)** — 정적 마크다운 블로그

## 확장은 이렇게 동작한다
1. 감시할 사이트를 보고 있는 동안만 사용 시간을 누적한다(탭이 보이고 포커스 있을 때만).
2. **사용 한도**(기본 20분)에 닿으면 화면 전체를 나무 오버레이로 덮는다.
3. **휴식 시간**(기본 5분) 동안 닫을 수 없고, 그사이 묘목이 노송까지 자란다.
4. 휴식이 끝나면 오버레이가 사라지고 사용 누적이 초기화된다.

감시 대상 두 카테고리(팝업에서 선택):
- **바이브코딩(AI)**: ChatGPT · Claude · Gemini · Perplexity
- **소셜 미디어**: YouTube · X · Instagram · TikTok · Reddit

> 사용 시간·설정은 `chrome.storage.local` 에만 저장된다. 외부 전송 없음, 네트워크 권한 없음.

## 확장 설치 (개발자 모드, 빌드 불필요)
1. 크롬 주소창에 `chrome://extensions` → **개발자 모드** 켜기
2. **압축해제된 확장 프로그램을 로드** → 이 저장소의 `extension/` 폴더 선택
3. 툴바 아이콘에서 모드·사용 한도·휴식 시간을 정하고 저장
   - 자세한 건 [`extension/README.md`](extension/README.md)

파이어폭스: `about:debugging` → 이 Firefox → 임시 부가 기능 로드 → `extension/manifest.json`.

## 나무 이미지 (사진 우선, SVG 폴백)
오버레이의 나무는 **성장 5단계 사진**(`assets/tree/stage-0.jpg` ~ `stage-4.jpg`)을 쓰고,
사진이 없으면 `tree-art.js` 의 SVG 소나무로 폴백한다.

- 도감 수종: `assets/trees/<slug>.jpg` + `assets/trees/index.json`(서식지 분류)
- 생성 스크립트(`scripts/`, Gemini 이미지 모델 사용):
  - `gen-tree-images.mjs` — 성장 5단계(참조-체이닝)
  - `gen-tree-gallery.mjs` — 도감 수종(서식지별)
  - `gen-strip.mjs` — 한 장에 같은 나무 5단계 필름스트립
  - `gen-imagen.mjs` — Imagen 4로 한 요청 다중 생성
  - 실행: `GEMINI_API_KEY=<키> node scripts/<파일>` (키는 커밋 금지)

## 구조
```
prompt-tree/
├── index.html            # 스크린타임 키퍼 랜딩 + 체험 + 도감 (ko/en/zh)
├── tree-art.js           # 나무 SVG 렌더 + 사진 폴백
├── assets/
│   ├── tree/             # stage-0~4.jpg (성장 시퀀스) + growth-strip.jpg
│   └── trees/            # 도감 수종 + index.json
├── extension/            # 스크린타임 게이트키퍼 (MV3)
│   ├── manifest.json · gatekeeper.js · tree-art.js · popup.html · popup.js
│   ├── assets/tree/      # 오버레이용 단계 사진(번들)
│   └── index.html        # 설치 안내 페이지
├── blog/                 # 정적 블로그 (index/post/app.js/blog.css)
├── posts/                # 블로그 글(마크다운)
└── scripts/              # 이미지 생성 스크립트
```

## 배포 (GitHub Pages)
`main` 브랜치에 푸시하면 자동 배포된다. (Settings → Pages → Deploy from a branch · main · `/`)

## 한계 — 모바일
브라우저 확장은 **PC + 안드로이드 Firefox** 에서만 동작하고, 폰의 **앱**(유튜브·인스타 앱)은 막지 못한다.
폰에서 앱까지 차단하려면 iOS Screen Time / Android Digital Wellbeing 기반 **네이티브 앱**이 필요하다(별도 작업).
