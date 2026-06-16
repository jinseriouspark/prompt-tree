# 극사실주의 나무 사진 생성 프롬프트

같은 나무가 건강 상태만 변해 보이도록 **같은 시드(77) · 같은 구도 · 같은 종(oak)** 으로 고정한다.
해상도 권장: 세로 2:3 (예: 1024x1536). 생성 후 `stage-N.jpg` 로 저장.

공통 스타일:
`Hyperrealistic photograph, a single solitary oak tree standing alone in an open green grassy meadow, centered composition, professional nature photography, 8k, ultra sharp focus, highly detailed bark, depth of field.`

- **stage-0.jpg (고사목)**: COMPLETELY DEAD — bare leafless skeletal branches, cracked gray peeling bark, no leaves, gloomy overcast sky, dry cracked dead grass, desaturated.
- **stage-1.jpg (시듦)**: DYING/WILTING — sparse branches with a few brown wilted drooping dry leaves, mostly bare, withered, dull cloudy sky, patchy yellowing grass.
- **stage-2.jpg (평범)**: ORDINARY — moderate plain green foliage, developing canopy, healthy but unremarkable, soft neutral daylight, ordinary green grass.
- **stage-3.jpg (건강)**: HEALTHY/THRIVING — full lush dense vibrant green canopy, vivid green leaves, warm sunny day, blue sky with soft clouds, bright green grass.
- **stage-4.jpg (만개)**: FLOURISHING — enormous lush green canopy bursting with pink and white blossoms, radiant golden sunlight, sunbeams, magical glowing atmosphere, flower-covered grass, butterflies.

생성 도구 예: Hugging Face Z-Image-Turbo (익명은 ZeroGPU 할당량 제한 있음 → HF_TOKEN 권장).
