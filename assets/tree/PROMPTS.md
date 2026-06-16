# 나무 사진 5단계 — 나노 바나나 2(Gemini Image) 프롬프트

휴식 화면에서 묘목 → 노송(老松)으로 "같은 나무"가 자라 보이게 하려면,
**같은 나무·같은 구도**를 유지한 채 건강 상태만 바꾼다.

## 만드는 법 (일관성 유지가 핵심)
1. 먼저 **stage-3 (건강)** 한 장을 생성한다 — 이게 기준 나무가 된다.
2. 나노 바나나 2에서 **그 이미지를 첨부(reference)** 한 뒤, 아래 각 단계 프롬프트로
   "같은 나무, 같은 각도, 같은 배경, 상태만 이렇게 바꿔줘"라고 변형 생성한다.
3. 1:1 또는 4:3, 정사각에 가깝게(휴식 화면은 가로 400×360 비율로 잘려 들어감).
4. `stage-0.jpg ~ stage-4.jpg` 로 저장.

## 공통(베이스) 프롬프트
> A single Korean red pine tree (소나무) standing alone on a small grassy mound,
> centered composition, eye-level wide shot, photorealistic nature photography,
> reddish-brown curved trunk, layered tiers of pine needles, soft depth of field,
> 8k, ultra sharp, natural lighting. Keep the SAME tree, SAME angle, SAME background
> across all variations — only the tree's health and weather change.

## 단계별 (상태만 교체)
- **stage-0.jpg · 고사목**: completely dead pine, bare gray skeletal branches, no needles,
  cracked peeling bark, gloomy overcast sky, dry dead grass, desaturated, bleak.
- **stage-1.jpg · 시듦**: dying pine, sparse brown/yellow drooping needles, mostly bare,
  withered, dull cloudy sky, patchy yellowing grass.
- **stage-2.jpg · 평범**: ordinary young pine, moderate plain green needles, developing form,
  healthy but unremarkable, soft neutral daylight, ordinary green grass.
- **stage-3.jpg · 건강** *(기준 이미지)*: thriving pine, full lush dense vivid green needles,
  warm sunny day, blue sky with soft clouds, bright green grass.
- **stage-4.jpg · 노송/만개**: majestic old pine (노송), enormous lush canopy with a few pine cones,
  radiant golden sunlight and sunbeams, magical glowing warm atmosphere, flowers in the grass.

## 어디에 넣나
- 웹(랜딩·체험 화면): 이 폴더 `assets/tree/stage-N.jpg`
- 확장 오버레이: `extension/assets/tree/stage-N.jpg` (같은 5장을 복사)
- 프롬프트나무 웹앱: `tree/assets/tree/stage-N.jpg`

세 곳 모두 **사진이 있으면 자동으로 사진**, 없으면 SVG 소나무로 폴백한다.
즉 5장만 만들어 떨구면 전부 고화질 사진 버전이 된다.

> 참고: 나노 바나나 2(Google Gemini) 대신 다른 도구를 써도 된다 —
> 핵심은 "같은 나무, 상태만 5단계".
