# GUAVAMAX 專案筆記（給 Claude 看的）

- 一律用**繁體中文**回覆與撰寫內容。
- 網站：https://blog.guavamax.com，GitHub Pages + GitHub Actions 部署（push 到 main 就會建置）。

## 架構
- `build.py`：自製靜態網站產生器（markdown + pygments），輸出到 `dist/`（不進 git）。設定在 `site.json`。
- 本機建置：`python3 build.py`；預覽：`python3 -m http.server 8765 --directory dist`。
- `content/posts/*.md`：文章。front matter 有 `draft: true` → 只出現在 `/drafts/`（noindex、無廣告）。
- 排程發布：`date` 以台北時間解讀，未來日期先隱藏；Actions 每小時（`1 * * * *`）重建，時間到自動上線。
- `content/pages/`：關於、聯絡、隱私權頁。
- `content/games/*.md`：遊戲頁（title、title_en、slug、description、script、cover、order、controls、`portrait: true` 為直式）。
  每款遊戲都要有「## 玩法說明」和「## 開發筆記」。
- 遊戲封面像素圖寫在 `build.py` 的 `COVERS`。
- `static/games/px.js`：小型 canvas 遊戲引擎 `PX`（sprite、run、beep、best、PICO-8 色盤 `PX.C`、60Hz 固定步長）。
  遊戲：guava-catch、bug-hunt、brick-breaker、seed-rush。
- `src/`：style.css、main.js（深淺色、私訊表單、giscus 延遲載入）。

## 規則
- **留言後端（PHP）與任何 server 設定、部署說明，絕對不要放進這個 repo**（`server/` 已在 .gitignore）。
- 不放任何 secret；`site.json` 只放公開值（Turnstile 只放 site key）。
- 遊戲不使用他人角色或品牌（如寶可夢），美術自己畫像素圖。
- commit 前先 `python3 build.py` 確認建置成功；推送流程：
  `git fetch origin main && git add -A && git commit && git rebase origin/main && git push origin HEAD:main`
