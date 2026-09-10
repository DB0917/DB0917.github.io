# DB0917 Blog

這是一個不需建置工具的靜態 Blog，可直接部署到 GitHub Pages。

## 新增文章

1. 複製 `posts/_template.md`，改名為英文小寫的網址名稱，例如 `my-first-post.md`。
2. 在新檔案開頭的資訊區塊填寫 `title`、`date`、`tags` 與 `description`，接著直接寫 Markdown 正文。
3. 在 `data/posts.json` 最上方新增對應資料。`slug` 必須與 Markdown 檔名相同（不含 `.md`）。

```json
{
  "slug": "my-first-post",
  "title": "我的第一篇文章",
  "date": "2026-09-12",
  "tags": ["筆記", "生活"],
  "excerpt": "這是一段顯示在首頁的文章摘要。"
}
```

## 自訂外觀與互動

- `assets/css/custom.css`：改色彩、字型或新增樣式。
- `assets/js/custom.js`：加入網站互動或第三方工具。
- `index.html`：首頁的介紹、導覽與關於我。
- `post.html`：所有文章共用的頁面骨架。

文章透過瀏覽器讀取 Markdown；請用本機伺服器預覽或部署至 GitHub Pages，不要直接雙擊開啟 HTML。
