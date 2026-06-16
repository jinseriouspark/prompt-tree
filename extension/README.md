# 나무 문지기 (Tree Gatekeeper)

[Cat Gatekeeper](https://zokuzoku.github.io/cat-gatekeeper/) 스타일의 스크린타임 문지기 — 고양이 대신 **나무**.
지정한 사이트(X·Instagram·TikTok·YouTube·Facebook·Reddit)에 머문 시간을 재고,
**사용 한도를 넘기면 화면 전체를 "자라는 나무" 오버레이로 덮어** 정해진 시간만큼 쉬게 한다.

> 모든 시간 기록·설정은 `chrome.storage.local`(이 브라우저 안)에만 저장된다. 외부 전송 0.

## 동작
1. 감시 대상 사이트를 보고 있는 동안 시간을 1초씩 누적한다(탭이 보이고 포커스 있을 때만).
2. 누적이 **사용 한도(기본 20분)** 에 닿으면 화면을 나무 오버레이로 덮는다.
3. **휴식 시간(기본 5분)** 동안 닫을 수 없고, 그 사이 묘목이 노송(老松)까지 자란다.
4. 휴식이 끝나면 오버레이가 사라지고 사용 누적이 0으로 리셋된다.
5. 날짜가 바뀌면 누적도 초기화된다.

## 설치 (개발자 모드, 빌드 불필요)
1. Chrome 주소창에 `chrome://extensions` → 우측 상단 **개발자 모드** 켜기
2. **압축해제된 확장 프로그램을 로드** → 이 `extension/` 폴더 선택
3. 툴바의 🌲 아이콘 클릭 → 사용 한도·휴식 시간·감시 사이트 설정 후 **저장**
   - (설정을 바꾼 뒤에는 해당 사이트 탭을 새로고침하면 즉시 반영)

Firefox 는 `about:debugging` → **이 Firefox** → **임시 부가 기능 로드** → `manifest.json` 선택.

## 파일
```
extension/
├── manifest.json   # MV3. 감시 사이트 매칭 + 팝업
├── gatekeeper.js   # (콘텐츠) 시간 추적 + 차단 오버레이
├── tree-art.js     # (콘텐츠) 휴식 진행도 → 소나무 SVG 장면
├── popup.html      # 설정 UI
└── popup.js        # 설정 저장 (storage.local)
```

## 커스터마이즈
- 기본 한도/휴식/사이트: `gatekeeper.js` 와 `popup.js` 의 `DEFAULTS`.
- 감시 사이트를 늘리려면 `manifest.json` 의 `content_scripts.matches` 와 `popup.js` 의 `ALL_SITES` 를 함께 추가.
- 나무 그림: `tree-art.js` (웹앱 `tree/src/skins/tree.js` 와 동일한 소나무 렌더러).
