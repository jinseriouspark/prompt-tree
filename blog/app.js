// app.js — 의존성 없는 초경량 블로그 엔진.
// posts/ 의 .md 를 불러와 목록(index.html)과 글(post.html)을 그린다.
// 글을 추가하려면: (1) posts/<slug>.md 작성 (2) 아래 POSTS 에 한 줄 추가.

const POSTS = [
  {
    slug: "hello-pine",
    title: "첫 글: 소나무 한 그루 심었습니다",
    date: "2026-06-16",
    tags: ["일기", "시작"],
    summary: "프롬프트 나무를 블로그로 옮겨 심었어요. 묘목부터 천천히 키워볼게요.",
  },
  {
    slug: "vibe-coding-note",
    title: "바이브 코딩 노트 — 말투가 코드를 바꾼다",
    date: "2026-06-15",
    tags: ["개발", "바이브코딩"],
    summary: "AI에게 다정하게 말하면 결과도 좋아질까? 한 달간의 관찰.",
  },
];

// --- 미니 마크다운 → HTML -------------------------------------------------
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function inline(text) {
  let t = escapeHtml(text);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2"/>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return t;
}

function mdToHtml(src) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let i = 0;
  let para = [];
  const flushPara = () => {
    if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; }
  };

  while (i < lines.length) {
    const line = lines[i];

    // 코드 블록 ```
    if (/^```/.test(line)) {
      flushPara();
      i++;
      const code = [];
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      i++; // 닫는 ```
      html += `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`;
      continue;
    }
    // 제목
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushPara(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }
    // 수평선
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushPara(); html += "<hr/>"; i++; continue; }
    // 인용
    if (/^>\s?/.test(line)) {
      flushPara();
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
      html += `<blockquote>${inline(q.join(" "))}</blockquote>`;
      continue;
    }
    // 순서 없는 목록
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
      html += `<ul>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ul>`;
      continue;
    }
    // 순서 있는 목록
    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      html += `<ol>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ol>`;
      continue;
    }
    // 빈 줄 → 문단 종료
    if (/^\s*$/.test(line)) { flushPara(); i++; continue; }
    // 일반 문단
    para.push(line.trim());
    i++;
  }
  flushPara();
  return html;
}

// --- 렌더 -----------------------------------------------------------------
function fmtDate(d) {
  const [y, m, day] = d.split("-");
  return `${y}.${m}.${day}`;
}

function renderList(el) {
  const sorted = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!sorted.length) { el.innerHTML = `<p class="empty">아직 글이 없어요. 곧 첫 글을 심을게요 🌱</p>`; return; }
  el.innerHTML = sorted
    .map(
      (p) => `<li class="post-card"><a href="post.html?slug=${encodeURIComponent(p.slug)}">
        <h2>${escapeHtml(p.title)}</h2>
        <div class="post-meta"><span>${fmtDate(p.date)}</span>${(p.tags || []).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}</div>
        <p class="summary">${escapeHtml(p.summary || "")}</p>
      </a></li>`
    )
    .join("");
}

async function renderPost(elTitle, elMeta, elBody) {
  const slug = new URLSearchParams(location.search).get("slug");
  const meta = POSTS.find((p) => p.slug === slug);
  if (!slug || !meta) { elBody.innerHTML = `<p class="empty">글을 찾을 수 없어요.</p>`; return; }
  document.title = `${meta.title} — 진슬의 정원`;
  elTitle.textContent = meta.title;
  elMeta.innerHTML = `${fmtDate(meta.date)} · ${(meta.tags || []).map((t) => `#${escapeHtml(t)}`).join(" ")}`;
  try {
    const res = await fetch(`../posts/${slug}.md`);
    if (!res.ok) throw new Error("not found");
    elBody.innerHTML = mdToHtml(await res.text());
  } catch {
    elBody.innerHTML = `<p class="empty">글 내용을 불러오지 못했어요. (정적 서버에서 열어주세요)</p>`;
  }
}

// --- 진입점 ---------------------------------------------------------------
if (typeof document !== "undefined") {
  const list = document.getElementById("postList");
  if (list) renderList(list);
  const body = document.getElementById("postBody");
  if (body) renderPost(document.getElementById("postTitle"), document.getElementById("postHeadMeta"), body);
}

export { mdToHtml, POSTS };
