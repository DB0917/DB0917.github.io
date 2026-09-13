// 隨機橫幅圖片庫
const bannerImages = [
  "assets/images/banners/1.jpg",
  "assets/images/banners/2.jpg",
  "assets/images/banners/3.jpg"
];

function getRandomBanner() {
  if (!bannerImages.length) return "";
  const randomIndex = Math.floor(Math.random() * bannerImages.length);
  return bannerImages[randomIndex];
}

const postsUrl = "data/posts.json";
const blogConfig = window.BLOG_CONFIG || {};

document.querySelectorAll("#year").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

const formatDate = (date) => new Intl.DateTimeFormat("zh-TW", {
  year: "numeric", month: "short", day: "numeric"
}).format(new Date(`${date}T00:00:00`));

function renderHomeBanner() {
  const banner = document.querySelector("#home-banner");
  const image = document.querySelector("#home-banner-image");
  if (!banner || !image) return;

  const config = window.BLOG_CONFIG?.homeBanner;
  const srcSetting = config?.src;
  let finalSrc = "";

  if (srcSetting === "none") {
    banner.hidden = true;
    return;
  } else if (!srcSetting || srcSetting === "random") {
    finalSrc = typeof getRandomBanner === "function" ? getRandomBanner() : "";
  } else {
    finalSrc = srcSetting;
  }

  if (!finalSrc) return;

  image.src = finalSrc;
  image.alt = config?.alt || "首頁橫幅";
  banner.hidden = false;
  banner.parentElement?.classList.add("has-banner");

  // 👇 新增出處標籤處理邏輯
  const existingCredit = banner.querySelector('.banner-credit');
  if (existingCredit) existingCredit.remove(); // 避免重複加入

  if (config?.credit) {
    const creditEl = document.createElement('figcaption');
    creditEl.className = 'banner-credit';
    // 支援 Markdown 超連結解析
    creditEl.innerHTML = typeof renderInlineMarkdown === 'function' 
      ? renderInlineMarkdown(config.credit) 
      : config.credit;
    banner.appendChild(creditEl);
  }
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return String(tags).split(/\s*[/,]\s*/).map((tag) => tag.trim()).filter(Boolean);
}

async function getPosts() {
  const response = await fetch(postsUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("文章列表讀取失敗");
  const posts = await response.json();

  return Promise.all(posts.map(async (post) => {
    try {
      const articleResponse = await fetch(`posts/${encodeURIComponent(post.slug)}.md`, { cache: "no-store" });
      if (!articleResponse.ok) return post;
      const { metadata } = splitFrontmatter(await articleResponse.text());
      return {
        ...post,
        title: metadata.title || post.title,
        date: metadata.date || post.date,
        tags: metadata.tags ? parseTags(metadata.tags) : post.tags,
        excerpt: metadata.description || post.excerpt
      };
    } catch {
      return post;
    }
  }));
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

async function renderArchivePage() {
  const archiveList = document.querySelector("#archive-list");
  const sidebarTagList = document.querySelector("#sidebar-tag-list");
  const resetBtn = document.querySelector("#reset-filter");
  
  if (!archiveList || !sidebarTagList) return;
  
  try {
    const posts = await getPosts();
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const postsByYear = new Map();
    posts.forEach(post => {
      const year = new Date(post.date).getFullYear();
      if (!postsByYear.has(year)) postsByYear.set(year, []);
      postsByYear.get(year).push(post);
    });

    const sortedYears = Array.from(postsByYear.keys()).sort((a, b) => b - a);
    
    archiveList.innerHTML = sortedYears.map(year => `
      <div class="archive-year-group">
        <h2 class="archive-year">${year}</h2>
        <div class="post-list">
          ${postsByYear.get(year).map(post => `
            <a class="post-card" href="post.html?slug=${encodeURIComponent(post.slug)}">
              <time class="post-date" datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
              <h3>${escapeHtml(post.title)}</h3>
              <span class="post-tags" data-tags="${escapeHtml(post.tags.join(","))}">${post.tags.map(escapeHtml).join(" · ")}</span>
            </a>
          `).join("")}
        </div>
      </div>
    `).join("");

    const allTags = new Set();
    posts.forEach(post => parseTags(post.tags).forEach(tag => allTags.add(tag)));
    
    const sortedTags = Array.from(allTags).sort((a, b) => a.localeCompare(b, "zh-Hant"));
    sidebarTagList.innerHTML = sortedTags.map(tag => `
      <button class="sidebar-tag" data-tag="${escapeHtml(tag)}"># ${escapeHtml(tag)}</button>
    `).join("");

    const tagButtons = document.querySelectorAll('.sidebar-tag');
    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedTag = btn.getAttribute('data-tag');
        tagButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        if (resetBtn) resetBtn.style.display = 'block';

        document.querySelectorAll('#archive-list .post-card').forEach(card => {
          const tagsText = card.querySelector('.post-tags').getAttribute('data-tags');
          card.style.display = (tagsText && tagsText.includes(selectedTag)) ? 'block' : 'none';
        });

        document.querySelectorAll('.archive-year-group').forEach(group => {
          const visiblePosts = Array.from(group.querySelectorAll('.post-card')).filter(card => card.style.display !== 'none');
          group.style.display = visiblePosts.length === 0 ? 'none' : 'block';
        });
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        tagButtons.forEach(b => b.classList.remove('is-active'));
        resetBtn.style.display = 'none';
        document.querySelectorAll('#archive-list .post-card').forEach(card => card.style.display = 'block');
        document.querySelectorAll('.archive-year-group').forEach(group => group.style.display = 'block');
      });
    }
  } catch (error) {
    archiveList.innerHTML = '<p class="error">歸檔目前無法載入，請稍後再試。</p>';
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

function renderInlineMarkdown(text) {
  const mathFragments = [];
  const protectedText = String(text).replace(
    /\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\\begin\{([a-zA-Z*]+)\}[\s\S]*?\\end\{\1\}/g,
    (fragment) => {
      const token = "@@MATH" + mathFragments.length + "@@";
      mathFragments.push(escapeHtml(fragment));
      return token;
    }
  );

  return escapeHtml(protectedText)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler" tabindex="0">$1</span>')
    .replace(/\[([^\]]+)\]\{([a-zA-Z0-9#,-]+)\}/g, (match, content, color) => {
      const themeVars = ['accent', 'muted', 'ink', 'paper'];
      const targetColor = themeVars.includes(color.toLowerCase()) ? `var(--${color})` : color;
      return `<span style="color: ${targetColor}; font-weight: 500;">${content}</span>`;
    })
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, url) => {
      const isExternal = /^https?:\/\//i.test(url);
      const target = isExternal ? ' target="_blank" rel="noreferrer"' : '';
      return `<a href="${url}"${target}>${title}</a>`;
    })
    .replace(/@@MATH(\d+)@@/g, (_, index) => mathFragments[Number(index)]);
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = null;
  let code = null;
  let callout = null;
  const calloutLabels = { success: "例題", info: "資訊", warning: "注意", danger: "重要", note: "筆記", cite: "出處來源" };

  const flushParagraph = () => {
    if (paragraph.length) {
      const content = renderInlineMarkdown(paragraph.join("\n")).replace(/\\\n/g, "<br>\n").replace(/\n/g, " ");
      html.push(`<p>${content}</p>`);
    }
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  lines.forEach((line) => {
    if (line.startsWith("```") && !callout) {
      flushParagraph(); flushList();
      if (code) {
        html.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
        code = null;
      } else { code = { lines: [] }; }
      return;
    }
    if (code && !callout) { code.lines.push(line); return; }
    
    if (callout) {
      if (line.trim() === ":::") {
        const title = callout.title || calloutLabels[callout.kind];
        html.push('<aside class="markdown-callout markdown-callout-' + callout.kind + '"><p class="markdown-callout-title">' + escapeHtml(title) + '</p><div class="markdown-callout-content">' + renderMarkdown(callout.lines.join("\n")) + "</div></aside>");
        callout = null;
      } else { callout.lines.push(line); }
      return;
    }
    if (!line.trim()) { flushParagraph(); flushList(); return; }
    
    const calloutStart = line.match(/^:::\s*(success|succes|info|warning|danger|note)(?:\s+(.+))?\s*$/i);
    if (calloutStart) {
      flushParagraph(); flushList();
      const kind = calloutStart[1].toLowerCase() === "succes" ? "success" : calloutStart[1].toLowerCase();
      callout = { kind, title: calloutStart[2]?.trim(), lines: [] };
      return;
    }
    if (/^(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushParagraph(); flushList(); html.push("<hr />"); return; }
    
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    const quote = line.match(/^>\s?(.+)$/);
    
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
    } else if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? "ul" : "ol";
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((unordered || ordered)[1]);
    } else if (quote) {
      flushParagraph(); flushList();
      const rawText = quote[1];
      if (/^(?:--|—)\s*(.+)$/.test(rawText)) {
        const sourceText = rawText.replace(/^(?:--|—)\s*/, "");
        html.push(`<blockquote class="has-cite"><p class="quote-cite">— ${renderInlineMarkdown(sourceText)}</p></blockquote>`);
      } else {
        html.push(`<blockquote><p>${renderInlineMarkdown(rawText)}</p></blockquote>`);
      }
    } else {
      flushList(); paragraph.push(line.trim());
    }
  });
  
  flushParagraph(); flushList();
  if (code) html.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
  if (callout) {
    const title = callout.title || calloutLabels[callout.kind];
    html.push('<aside class="markdown-callout markdown-callout-' + callout.kind + '"><p class="markdown-callout-title">' + escapeHtml(title) + '</p><div class="markdown-callout-content">' + renderMarkdown(callout.lines.join("\n")) + "</div></aside>");
  }
  return html.join("\n");
}

function renderLatex(element) {
  if (!window.renderMathInElement || !element) return;
  window.renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true }
    ],
    throwOnError: false
  });
}

async function renderArticle() {
  const article = document.querySelector("#article");
  if (!article) return;
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug || /[\\/:?#]/.test(slug) || slug === "." || slug === "..") {
    article.innerHTML = '<p class="error">找不到這篇文章。</p>';
    return;
  }
  try {
    const response = await fetch(`posts/${slug}.md`);
    if (!response.ok) throw new Error("文章不存在");
    const { metadata, content } = splitFrontmatter(await response.text());
    document.title = `${metadata.title || "文章"} | DB0917`;

    let finalBanner = "";
    if (metadata.banner === "none") {
      finalBanner = "";
    } else if (metadata.banner && metadata.banner !== "random") {
      finalBanner = metadata.banner;
    } else {
      finalBanner = typeof getRandomBanner === "function" ? getRandomBanner() : "";
    }

    let bannerCreditHtml = "";
    if (metadata.banner_credit) {
       bannerCreditHtml = `<figcaption class="banner-credit">${renderInlineMarkdown(metadata.banner_credit)}</figcaption>`;
    }

    article.innerHTML = `
      <header class="article-header${finalBanner ? " has-banner" : ""}">
        ${finalBanner ? `
          <figure class="banner article-banner">
            <img src="${escapeHtml(finalBanner)}" alt="${escapeHtml(metadata.bannerAlt || "")}" />
            ${bannerCreditHtml}
          </figure>
        ` : ""}
        <div class="article-header-text">
          <p class="article-meta">${metadata.date ? formatDate(metadata.date) : ""}${metadata.tags ? ` / ${escapeHtml(metadata.tags)}` : ""}</p>
          <h1>${escapeHtml(metadata.title || "未命名文章")}</h1>
          ${metadata.description ? `<p class="article-lead">${escapeHtml(metadata.description)}</p>` : ""}
        </div>
      </header>
      <div class="article-content">${renderMarkdown(content)}</div>
    `;
    renderLatex(article.querySelector(".article-content"));
  } catch (error) {
    article.innerHTML = '<p class="error">這篇文章目前無法載入。</p>';
  }
}

renderHomeBanner();
renderPostList();
renderArchivePage();
renderArticle();

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);