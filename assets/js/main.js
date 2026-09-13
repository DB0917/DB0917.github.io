// 隨機橫幅圖片庫 (有新增或修改照片時，在這裡更新檔名)
const bannerImages = [
  "assets/images/banners/1.jpg",
  "assets/images/banners/2.jpg",
  "assets/images/banners/3.jpg"
];

// 取得隨機橫幅路徑的函式
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

/* 深色模式暫時停用。恢復 index.html 與 post.html 的 theme.js 和按鈕後，再移除此註解。
const themeToggle = document.querySelector("#theme-toggle");
if (themeToggle) {
  const updateThemeToggle = () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    themeToggle.querySelector("span").textContent = isDark ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", isDark ? "切換為日間模式" : "切換為夜間模式");
    themeToggle.title = themeToggle.getAttribute("aria-label");
  };
  updateThemeToggle();
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    window.setTheme(nextTheme);
    updateThemeToggle();
  });
}
*/

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

  // 1. 如果設定為 "none" -> 直接隱藏首頁橫幅
  if (srcSetting === "none") {
    banner.hidden = true;
    return;
  } 
  // 2. 如果設定為 "random"、留空，或是沒寫 src -> 抽隨機圖片
  else if (!srcSetting || srcSetting === "random") {
    finalSrc = typeof getRandomBanner === "function" ? getRandomBanner() : "";
  } 
  // 3. 指定了具體圖片路徑 -> 顯示固定圖片
  else {
    finalSrc = srcSetting;
  }

  if (!finalSrc) return;

  image.src = finalSrc;
  image.alt = config?.alt || "首頁橫幅";
  banner.hidden = false;
  banner.parentElement?.classList.add("has-banner");
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return String(tags)
    .split(/\s*[/,]\s*/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function getPosts() {
  const response = await fetch(postsUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("文章列表讀取失敗");
  const posts = await response.json();

  // 文章清單只負責提供 slug 與首頁排序；顯示標題以 Markdown 為準。
  return Promise.all(posts.map(async (post) => {
    try {
      const articleResponse = await fetch(`posts/${encodeURIComponent(post.slug)}.md`, {
        cache: "no-store"
      });
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
      // 若單篇文章暫時讀取失敗，仍可使用清單中的備用標題顯示首頁。
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
  
  // 如果不是歸檔頁面，就直接跳出
  if (!archiveList || !sidebarTagList) return;
  
  try {
    const posts = await getPosts();
    
    // 1. 確保文章由新到舊排序
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. 將文章依照「年份」分組
    const postsByYear = new Map();
    posts.forEach(post => {
      const year = new Date(post.date).getFullYear();
      if (!postsByYear.has(year)) postsByYear.set(year, []);
      postsByYear.get(year).push(post);
    });

    const sortedYears = Array.from(postsByYear.keys()).sort((a, b) => b - a);
    
    // 3. 渲染左側年份時間軸
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

    // 4. 渲染右側所有出現過的標籤
    const allTags = new Set();
    posts.forEach(post => parseTags(post.tags).forEach(tag => allTags.add(tag)));
    
    const sortedTags = Array.from(allTags).sort((a, b) => a.localeCompare(b, "zh-Hant"));
    sidebarTagList.innerHTML = sortedTags.map(tag => `
      <button class="sidebar-tag" data-tag="${escapeHtml(tag)}"># ${escapeHtml(tag)}</button>
    `).join("");

    // 5. 加入「點擊標籤動態篩選」黑魔法
    const tagButtons = document.querySelectorAll('.sidebar-tag');
    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedTag = btn.getAttribute('data-tag');
        
        // 變更標籤的視覺狀態
        tagButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        if (resetBtn) resetBtn.style.display = 'block';

        // 篩選左側文章
        document.querySelectorAll('#archive-list .post-card').forEach(card => {
          const tagsText = card.querySelector('.post-tags').getAttribute('data-tags');
          if (tagsText && tagsText.includes(selectedTag)) {
            card.style.display = 'block'; // 顯示
          } else {
            card.style.display = 'none';  // 隱藏
          }
        });

        // 如果該年份沒有任何顯示的文章，就把那整個年份標題也藏起來
        document.querySelectorAll('.archive-year-group').forEach(group => {
          const visiblePosts = Array.from(group.querySelectorAll('.post-card')).filter(card => card.style.display !== 'none');
          group.style.display = visiblePosts.length === 0 ? 'none' : 'block';
        });
      });
    });

    // 6. 重置篩選按鈕
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
      // 支援主題變數：如果輸入 accent、muted 等，自動轉成 var(--accent)
      const themeVars = ['accent', 'muted', 'ink', 'paper'];
      const targetColor = themeVars.includes(color.toLowerCase()) ? `var(--${color})` : color;
      return `<span style="color: ${targetColor}; font-weight: 500;">${content}</span>`;
    })
    /* 1. 新增圖片處理語法：![alt](url) */
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    /* 2. 修復超連結語法：支援相對路徑，並只對外連網站加 target="_blank" */
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
  const calloutLabels = {
    success: "例題",
    info: "資訊",
    warning: "注意",
    danger: "重要",
    note: "筆記"
  };

  const flushParagraph = () => {
    if (paragraph.length) {
      const content = renderInlineMarkdown(paragraph.join("\n"))
        .replace(/\\\n/g, "<br>\n")
        .replace(/\n/g, " ");
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
      flushParagraph();
      flushList();
      if (code) {
        html.push(`<pre><code>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
        code = null;
      } else {
        code = { lines: [] };
      }
      return;
    }
    if (code && !callout) {
      code.lines.push(line);
      return;
    }
    if (callout) {
      if (line.trim() === ":::") {
        const title = callout.title || calloutLabels[callout.kind];
        html.push('<aside class="markdown-callout markdown-callout-' + callout.kind + '"><p class="markdown-callout-title">' + escapeHtml(title) + '</p><div class="markdown-callout-content">' + renderMarkdown(callout.lines.join("\n")) + "</div></aside>");
        callout = null;
      } else {
        callout.lines.push(line);
      }
      return;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }
    const calloutStart = line.match(/^:::\s*(success|succes|info|warning|danger|note)(?:\s+(.+))?\s*$/i);
    if (calloutStart) {
      flushParagraph();
      flushList();
      const kind = calloutStart[1].toLowerCase() === "succes" ? "success" : calloutStart[1].toLowerCase();
      callout = { kind, title: calloutStart[2]?.trim(), lines: [] };
      return;
    }
    if (/^(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      flushList();
      html.push("<hr />");
      return;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    const quote = line.match(/^>\s?(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
    } else if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((unordered || ordered)[1]);
    } else if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${renderInlineMarkdown(quote[1])}</p></blockquote>`);
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  });
  flushParagraph();
  flushList();
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

    /* 橫幅邏輯：
       1. 如果 .md 沒寫 banner 或者是 banner: random -> 自動抽隨機圖片
       2. 如果 .md 寫了 banner: none -> 不顯示橫幅
       3. 如果 .md 寫了具體圖片路徑 (如 banner: assets/images/custom.png) -> 優先顯示該指定圖片 */
    let finalBanner = "";
    if (metadata.banner === "none") {
      finalBanner = "";
    } else if (metadata.banner && metadata.banner !== "random") {
      finalBanner = metadata.banner;
    } else {
      finalBanner = getRandomBanner();
    }

    article.innerHTML = `
      <header class="article-header${finalBanner ? " has-banner" : ""}">
        <p class="article-meta">${metadata.date ? formatDate(metadata.date) : ""}${metadata.tags ? ` / ${escapeHtml(metadata.tags)}` : ""}</p>
        <h1>${escapeHtml(metadata.title || "未命名文章")}</h1>
        ${finalBanner ? `<figure class="banner article-banner"><img src="${escapeHtml(finalBanner)}" alt="${escapeHtml(metadata.bannerAlt || "")}" /></figure>` : ""}
        ${metadata.description ? `<p class="article-lead">${escapeHtml(metadata.description)}</p>` : ""}
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

// 強制關閉瀏覽器的歷史滾動記憶，並在載入時滾動到最頂端
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);