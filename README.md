# guavamax
技術案例、開發筆記與網頁小遊戲 → https://blog.guavamax.com

## 結構

```
content/posts/   文章（Markdown，開頭為 front matter）
content/pages/   單頁（關於、隱私權政策）
src/             style.css、main.js
static/          原樣複製到網站根目錄（CNAME、字型、圖片）
build.py         靜態網站產生器，輸出到 dist/
```

## 本機預覽

```bash
pip install -r requirements.txt
python build.py --serve   # http://localhost:8000
```

## 新增文章

在 `content/posts/` 新增 `YYYY-MM-DD-slug.md`：

```markdown
---
title: 文章標題
description: 一兩句摘要（也會用在搜尋結果）
date: 2026-10-05
tags: [AI 應用, 標籤二]
slug: url-slug
---

內文……
```

提示框語法：

```markdown
!!! tip "標題"
    內容（縮排四格）
```

可用 `tip`、`note`、`warning`。front matter 加上 `draft: true` 則不會發布。

## 部署

push 到 `main` 後，GitHub Actions 會自動建置並發布到 GitHub Pages。

## Google AdSense

審核通過後，把 `site.json` 的 `adsense_client` 填成 `ca-pub-xxxxxxxx`，
重新部署即會在所有頁面加上 AdSense 程式碼並產生 `ads.txt`。

## 授權

文章與遊戲內容保留所有權利。像素字型為俐方體11號（Cubic 11），
依 SIL Open Font License 1.1 授權，見 `static/fonts/Cubic_11-OFL.txt`。
