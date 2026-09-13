# DB0917 Blog

這是一個不需建置工具的靜態 Blog，可直接部署到 GitHub Pages。

## 新增文章

1. 複製 `posts/_template.md`，改名為英文小寫的網址名稱，例如 `my-first-post.md`。
2. 在新檔案開頭的資訊區塊填寫 `title`、`date`、`tags` 與 `description`，接著直接寫 Markdown 正文。
3. 在 `data/posts.json` 最上方新增對應資料。`slug` 必須與 Markdown 檔名相同（不含 `.md`）。這個檔案決定首頁的文章清單與排序；首頁的標題、日期、標籤與摘要會自動讀取 Markdown 裡的 `title`、`date`、`tags` 與 `description`。只填入 `slug` 即可。

```json
{
  "slug": "my-first-post"
}
```

## 自訂外觀與互動

- `assets/css/custom.css`：改色彩、字型或新增樣式。
- `assets/js/custom.js`：加入網站互動或第三方工具。
- `index.html`：首頁的介紹、導覽與關於我。
- `post.html`：所有文章共用的頁面骨架。
- `tags.html`：依文章 Markdown 的 `tags` 自動整理的分類頁面。

## 加入橫幅

- 首頁：將圖片放到 `assets/images/` 後，在 `assets/js/custom.js` 的 `homeBanner` 設定填入圖片路徑。橫幅會顯示在首頁介紹文字後方。
- 文章頁：在文章最上方資訊區塊加入 `banner: assets/images/your-banner.jpg`；可選擇加入 `bannerAlt:` 供圖片替代文字使用。橫幅會顯示在文章標題文字後方。

文章透過瀏覽器讀取 Markdown，網站內建常用的 Markdown 排版支援；請用本機伺服器預覽或部署至 GitHub Pages，不要直接雙擊開啟 HTML。

## 數學公式（LaTeX）

文章頁支援 KaTeX 公式。行內公式使用 `$E = mc^2$`，獨立公式使用 `$$...$$`；也支援 `\(...\)` 與 `\[...\]`。

## 文字顏色 

[這是客製化橘色]{#ff7700}
[這是好看的粉紅]{#ff5f56}
[這是紅色的字]{red}
[這是自動變色]{accent}