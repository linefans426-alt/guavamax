---
title: Claude Code 很好用，但 Token 總是不夠？8 個實用省 Token 技巧
description: Claude Code 用一陣子就碰到用量上限？多半是因為它每次都在重新探索專案。本文教你用 CLAUDE.md、Skill、MCP 和幾個指令，讓 Claude 少走冤枉路，大幅節省 Token。
date: 2026-10-05 02:50
tags: [AI 應用, Claude Code, Token, MCP, 效率]
slug: save-claude-code-tokens
---

用了一陣子 [Claude Code](/posts/install-claude-code-on-mac/) 之後，很多人都會遇到同一個問題：**明明沒做什麼大事，用量卻一下子就到上限了。**

我自己的經驗是，Token 很少花在「寫程式」本身，大部分是花在**找東西**：

> 你只是丟一張截圖說「這個按鈕顏色改一下」，Claude 卻要先翻遍整個專案，搜尋、打開、讀了十幾個檔案，才找到要改的是哪一行。

而且下一次開新對話，它又會從頭再找一次。

這篇整理我實際在用的省 Token 方法，核心觀念只有一個：**讓 Claude 不用每次都重新認識你的專案。**

## 先搞懂：Token 都花去哪了？

Claude Code 每次回應時，都會把**整段對話、讀過的檔案內容、工具執行結果**一起送給模型。所以真正吃 Token 的通常是這些：

| 吃 Token 的來源 | 為什麼 |
| --- | --- |
| 重複探索專案 | 每次開新對話都要重新搜尋、讀檔，才知道東西在哪 |
| 讀大型檔案 | 一份 PDF、一個大 log、一個長 JSON，內容全部進入上下文 |
| 對話越拉越長 | 每一則新訊息，都會連同前面所有內容再送一次 |
| 冗長的工具輸出 | 跑測試、安裝套件印出的大量文字 |
| 模糊的指令 | 「幫我優化這個專案」會讓它掃描大量檔案 |

想知道目前的上下文被什麼佔用，可以在 Claude Code 裡輸入：

```text
/context
```

想看用量統計則用 `/usage`，訂閱方案還會顯示是哪些 Skill、MCP 伺服器用掉比較多額度。

## 技巧 1：把 CLAUDE.md 當成專案地圖

這是**最有效、也最多人沒做好**的一招。

`CLAUDE.md` 是放在專案根目錄的說明檔，**每次啟動 Claude Code 都會自動讀取**。你可以把它想成給 Claude 的「專案地圖」：寫清楚東西放在哪、怎麼用，它就不必每次重新探索。

### 先用 /init 產生第一版

```text
/init
```

Claude 會分析專案，自動產生一份包含建置指令、測試方式和專案慣例的 `CLAUDE.md`。

### 關鍵習慣：分析完，就叫它更新 CLAUDE.md

`/init` 只是起點。真正的省 Token 祕訣是：**每次 Claude 花力氣找到某個東西之後，就請它記下來。**

例如它花了一番功夫才找到首頁的元件和圖片放在哪裡，這時候直接說：

```text
把你剛剛找到的檔案位置和用法，整理更新到 CLAUDE.md
```

下次你再丟截圖說「首頁的按鈕改一下」，它看一眼 CLAUDE.md 就知道要改哪個檔案，不用再全專案搜尋。

### 一份好的 CLAUDE.md 長這樣

```markdown
# 專案說明

## 常用指令
- 開發：`npm run dev`
- 測試：`npm test`
- 建置：`npm run build`

## 畫面與檔案對應
- 首頁：`src/pages/Home.tsx`，主視覺區塊在 `src/components/Hero.tsx`
- 會員頁：`src/pages/Member/`，表單元件在 `src/components/forms/`
- 圖片：`public/images/`，首頁 banner 是 `public/images/home/`
- 共用顏色與字級：`src/styles/tokens.css`

## 慣例
- 元件用 function component，樣式用 CSS Modules
- API 呼叫統一寫在 `src/api/`，不要直接在元件裡 fetch
- commit 訊息用繁體中文
```

其中「**畫面與檔案對應**」這一段最值錢，它正好解決「傳截圖，Claude 找半天」的問題。

!!! tip "保持精簡"
    官方建議每份 CLAUDE.md 控制在 **200 行以內**。它每次都會被完整載入，寫太長反而浪費 Token，Claude 也比較容易忽略重點。只跟某些資料夾有關的規則，可以拆到 `.claude/rules/` 底下，並設定只在處理對應路徑的檔案時才載入。

## 技巧 2：把重複的流程做成 Skill

如果你常常重複貼同一段指示，例如「部署步驟」「PR 檢查清單」「新增 API 的固定寫法」，就很適合做成 **Skill**。

Skill 和 CLAUDE.md 最大的差別是載入方式：

| | CLAUDE.md | Skill |
| --- | --- | --- |
| 什麼時候載入 | 每次啟動都完整載入 | 平常只載入一行描述，用到時才載入完整內容 |
| 適合放什麼 | 專案地圖、全域規則 | 特定任務的步驟、長篇參考資料 |
| Token 成本 | 每次對話都要付 | 沒用到時幾乎不花 |

所以官方也建議：**CLAUDE.md 裡越寫越長的「流程說明」，應該搬到 Skill。**

### 建立一個 Skill

在專案建立 `.claude/skills/ui-fix/SKILL.md`：

```markdown
---
description: 根據使用者提供的截圖修改畫面。當使用者傳截圖並要求調整 UI 時使用。
---

## 步驟

1. 先查 CLAUDE.md 的「畫面與檔案對應」，找出截圖對應的頁面與元件。
2. 只打開相關的元件和樣式檔，不要全專案搜尋。
3. 顏色、字級一律使用 `src/styles/tokens.css` 裡的變數。
4. 修改後執行 `npm run lint`，只回報有錯誤的部分。
5. 如果找到了 CLAUDE.md 沒記錄的新對應關係，順便更新 CLAUDE.md。
```

之後輸入 `/ui-fix` 就能直接使用，Claude 也會在你傳截圖要求修改時自動套用。注意最後一步：**讓 Skill 自己維護 CLAUDE.md**，地圖就會越用越完整。

個人常用、跨專案通用的 Skill，可以放在 `~/.claude/skills/`。

## 技巧 3：PDF 和 Office 檔，先轉成文字再給 Claude

直接把 PDF 丟給 AI，除了文字之外還可能包含版面、圖片等資訊，佔用的 Token 往往比你想像的多很多。如果你需要的只是**裡面的文字內容**，先轉成文字再分析，通常能大幅降低用量。

微軟開源的 **MarkItDown** 可以把 PDF、Word、PowerPoint、Excel、HTML、EPUB 等格式轉成 Markdown，而且提供了 MCP 伺服器版本。

### 方法 A：接上 MarkItDown MCP

```bash
pip install markitdown-mcp
claude mcp add markitdown -- markitdown-mcp
```

接上後，它提供一個 `convert_to_markdown` 工具。你只要說「用 markitdown 把 `docs/規格書.pdf` 轉成文字再分析」，Claude 就會先轉檔，再用純文字進行後續處理。

### 方法 B：直接用指令轉檔（更省）

```bash
pip install 'markitdown[all]'
markitdown docs/規格書.pdf -o docs/規格書.md
```

轉好之後，請 Claude 讀 `.md` 檔就好。轉一次可以重複使用很多次，下次對話也不用再轉。

!!! note "CLI 通常比 MCP 更省"
    Claude Code 官方文件提到，能用指令列工具完成的事，通常比 MCP 更節省上下文。另外，PDF 轉文字會失去圖表和版面，如果分析需要看圖，還是要讓 Claude 讀原檔；掃描版 PDF 則需要 OCR 才能取出文字。

順帶一提：**沒在用的 MCP 伺服器記得關掉**。用 `/mcp` 可以查看並停用。

## 技巧 4：傳截圖時，順便給線索

就算 CLAUDE.md 寫得再好，指令越精準，Claude 要讀的檔案就越少。比較一下：

| 模糊的指令 | 精準的指令 |
| --- | --- |
| （截圖）這裡改一下 | （截圖）首頁 Hero 區塊的「立即註冊」按鈕，改成主色 |
| 登入有 bug | 輸入錯誤密碼後畫面變空白，問題應該在 `src/pages/Login.tsx` |
| 幫我優化效能 | 會員列表頁載入很慢，檢查 `MemberList.tsx` 的 API 呼叫 |

多打十個字，可能就省下它讀十個檔案的 Token。

## 技巧 5：換任務就 /clear，長對話用 /compact

**對話越長，每一則新訊息的成本就越高**，因為整段歷史都會一起送出。

- **切換到不相關的任務時**，輸入 `/clear` 開一段新對話。之前的內容對新任務沒幫助，只會浪費 Token。想之後回來，可以先用 `/rename` 幫對話取名，再用 `/resume` 找回。
- **同一個任務做很久時**，用 `/compact` 把前面的對話壓縮成摘要，還可以指定保留重點：

```text
/compact 保留目前修改過的檔案清單和還沒解決的錯誤
```

要注意，`/compact` 本身要讀過整段對話才能摘要，也會花 Token；如果只是想重新開始，`/clear` 完全不花錢。

## 技巧 6：讓 Subagent 處理「很吵」的工作

跑測試、翻 log、查大量文件這類工作，會產生大量輸出塞爆主對話。可以交給 **Subagent（子代理）** 處理：它在自己的上下文裡跑完，只把**摘要**交回主對話。

```text
用 subagent 跑完整個測試，只回報失敗的測試名稱和錯誤原因
```

進階用法是設定 **Hook**，在指令執行前就先過濾輸出，例如讓測試只顯示失敗的部分，可以把幾萬個 Token 的輸出壓到幾百個。

## 技巧 7：依任務選模型和思考強度

不是每件事都需要最強的模型和最深的思考：

- `/model`：切換模型。改文案、小修正用較輕量的模型就夠，複雜的架構設計再用最強的模型。
- `/effort`：調整思考強度。簡單任務降低強度，可以減少思考過程花掉的 Token。

## 技巧 8：先規劃，走錯就馬上停

- **大任務先用規劃模式**：按 <kbd>Shift</kbd> + <kbd>Tab</kbd> 切到 Plan mode，讓 Claude 先提出做法，確認方向對了再動手，避免做到一半才發現要整個重來。
- **發現方向不對就按 <kbd>Esc</kbd>**：立刻中斷，不要等它把錯的東西做完。需要的話用 `/rewind` 回到之前的檢查點。

## 省 Token 速查表

| 情境 | 做法 |
| --- | --- |
| 每次都要重新找檔案 | 維護 CLAUDE.md 的「畫面與檔案對應」 |
| Claude 剛找到重要資訊 | 請它「更新到 CLAUDE.md」 |
| 常重複貼同一段指示 | 做成 Skill |
| CLAUDE.md 越寫越長 | 把流程搬到 Skill，規則拆到 `.claude/rules/` |
| 要分析 PDF、Word | 先用 MarkItDown 轉成文字 |
| 傳截圖要修改 | 說明是哪一頁、哪個區塊 |
| 換到不相關的任務 | `/clear` |
| 同一任務做很久 | `/compact` 並指定保留重點 |
| 跑測試、看 log | 交給 Subagent |
| 簡單任務 | 換輕量模型、降低 `/effort` |
| 想知道 Token 花在哪 | `/context`、`/usage` |

## 結語

省 Token 的本質，其實就是**減少 Claude 的重複勞動**：

- 找過的路，寫進 CLAUDE.md
- 做過的流程，做成 Skill
- 大檔案，先轉成文字
- 用不到的歷史，就清掉

這些設定花不了多少時間，但用越久效果越明顯。Claude 會越來越「熟悉」你的專案，而且這份熟悉不是靠一直累積對話，而是靠你幫它整理好的地圖，這也呼應了我在〈[向老闆解釋 API 不會被訓練的兩年](/posts/why-ai-api-cannot-be-trained/)〉裡提到的觀念。

如果想進一步了解 MCP 是什麼、怎麼自己寫一個，可以參考〈[MCP 是什麼？和 API 差在哪](/posts/what-is-mcp-vs-api-and-deploy/)〉。

**參考資料**

- [Claude Code 官方文件：Manage costs effectively](https://code.claude.com/docs/en/costs)
- [Claude Code 官方文件：How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Claude Code 官方文件：Agent Skills](https://code.claude.com/docs/en/skills)
- [Microsoft MarkItDown（GitHub）](https://github.com/microsoft/markitdown)
