# 진슬의 정원 — 귀여운 정적 블로그

prompt-tree 스타일(따뜻한 톤 · 소나무 마스코트 · 카드)을 그대로 차용한, **빌드 불필요·의존성 0** 의 마크다운 블로그. 레포 루트에서 바로 서비스된다.

## 배포 주소 (GitHub Pages)
- 블로그(메인): **https://jinseriouspark.github.io/prompt-tree/**
- 소나무 나무앱: **https://jinseriouspark.github.io/prompt-tree/tree/**

> `.github/workflows/pages.yml` 가 main 푸시마다 자동 배포한다.
> **최초 1회만** 저장소 Settings → Pages → Source 를 **"GitHub Actions"** 로 설정하면 끝.

## 로컬 실행
```bash
python3 -m http.server 5174   # 레포 루트에서 → http://localhost:5174
```
> `file://` 직접 열기는 ES 모듈/fetch가 막히니 꼭 정적 서버로.

## 글 쓰는 법 (2단계)
1. `posts/<slug>.md` 파일 작성 (마크다운: 제목 `#`, 목록 `-`/`1.`, 인용 `>`, 코드 ``` ``` ```, **굵게**, *기울임*, `[링크](url)`, `![이미지](url)`)
2. `app.js` 맨 위 `POSTS` 배열에 한 줄 추가:
   ```js
   { slug: "my-post", title: "제목", date: "2026-06-20", tags: ["일기"], summary: "한 줄 요약" }
   ```
   끝. 목록·글 페이지가 자동 생성된다(날짜 내림차순 정렬).

## 폴더 구조
```
/                 ← 블로그 (index.html, post.html, app.js, blog.css, posts/)
/tree/            ← 소나무 나무앱 (기존 PWA 전체)
/extension/       ← 브라우저 확장 (Pages와 무관)
```

## 커스터마이즈
- 색/폰트: `blog.css` 상단 `:root` 변수
- 블로그 이름/태그라인/마스코트: `index.html`·`post.html` 헤더
- 사이트 제목: `app.js` 의 `renderPost` 내 `document.title`
