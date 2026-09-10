const postsUrl = "data/posts.json";

document.querySelectorAll("#year").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

const formatDate = (date) => new Intl.DateTimeFormat("zh-TW", {
  year: "numeric", month: "short", day: "numeric"
}).format(new Date(`${date}T00:00:00`));

async function getPosts() {
  const response = await fetch(postsUrl);
  if (!response.ok) throw new Error("文章列表讀取失敗");
  return response.json();
}

async function renderPostList() {
  const list = document.querySelector("#post-list");
  if (!list) return;
  try {
    const posts = await getPosts();
    document.querySelector("#post-count").textContent = `${posts.length} POSTS`;
    list.innerHTML = posts.map((post) => `
      <a class="post-card" href="post.html?slug=${encodeURIComponent(post.slug)}">
        <time class="post-date" datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <span class="post-tags">${post.tags.map(escapeHtml).join(" · ")}</span>
        <p>${escapeHtml(post.excerpt)}</p>
      </a>
    `).join("");
  } catch (error) {
    list.innerHTML = '<p class="error">文章目前無法載入，請稍後再試。</p>';
  }
}

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { metadata: {}, content: markdown };
  const metadata = Object.fromEntries(match[1].split("\n").map((line) => {
    const separator = line.indexOf(":");
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  return { metadata, content: match[2] };
}

async function renderArticle() {
  const article = document.querySelector("#article");
  if (!article) return;
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    article.innerHTML = '<p class="error">找不到這篇文章。</p>';
    return;
  }
  try {
    const response = await fetch(`posts/${slug}.md`);
    if (!response.ok) throw new Error("文章不存在");
    const { metadata, content } = splitFrontmatter(await response.text());
    document.title = `${metadata.title || "文章"} | DB0917`;
    article.innerHTML = `
      <header class="article-header">
        <p class="article-meta">${metadata.date ? formatDate(metadata.date) : ""}${metadata.tags ? ` / ${escapeHtml(metadata.tags)}` : ""}</p>
        <h1>${escapeHtml(metadata.title || "未命名文章")}</h1>
        ${metadata.description ? `<p class="article-lead">${escapeHtml(metadata.description)}</p>` : ""}
      </header>
      <div class="article-content">${marked.parse(content)}</div>
    `;
  } catch (error) {
    article.innerHTML = '<p class="error">這篇文章目前無法載入。</p>';
  }
}

renderPostList();
renderArticle();
