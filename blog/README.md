# 진슬의 정원 — 귀여운 정적 블로그

prompt-tree 스타일(따뜻한 톤 · 소나무 마스코트 · 카드)을 그대로 차용한, **빌드 불필요·의존성 0** 의 마크다운 블로그.

## 실행
```bash
cd blog
python3 -m http.server 5174   # http://localhost:5174
```
> `file://` 직접 열기는 ES 모듈/fetch가 막히니 꼭 정적 서버로.

## 글 쓰는 법 (2단계)
1. `posts/<slug>.md` 파일 작성 (마크다운: 제목 `#`, 목록 `-`, 인용 `>`, 코드 ``` ``` ```, **굵게**, *기울임*, `[링크](url)`, `![이미지](url)`)
2. `app.js` 맨 위 `POSTS` 배열에 한 줄 추가:
   ```js
   { slug: "my-post", title: "제목", date: "2026-06-20", tags: ["일기"], summary: "한 줄 요약" }
   ```
   끝. 목록·글 페이지가 자동 생성된다(날짜 내림차순 정렬).

## jinseriouspark.github.io 로 옮기기
이 `blog/` 폴더 내용을 그 레포 루트(또는 `/blog`)에 복사하면 그대로 동작한다.
- 레포 루트에 두면 주소는 `https://jinseriouspark.github.io/`
- 상단 메뉴의 "프롬프트나무" 링크(`../index.html`)는 옮긴 위치에 맞게 고치면 된다.

## 커스터마이즈
- 색/폰트: `blog.css` 상단 `:root` 변수
- 블로그 이름/태그라인/마스코트: `index.html`·`post.html` 헤더
- 사이트 제목: `app.js` 의 `renderPost` 내 `document.title`
