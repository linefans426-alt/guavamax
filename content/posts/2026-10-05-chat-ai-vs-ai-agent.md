---
title: Chat AI 和 AI Agent 差在哪？從「會說的大腦」到「能做事的助手」
description: Chat AI 是會思考、會回答的大腦，AI Agent 則是接上手腳、能自己把事情做完的助手。用 ChatGPT、Gemini、Claude 實例說明兩者差異，以及怎麼把聊天 AI 升級成 Agent。
date: 2026-10-05 01:40
tags: [AI 應用, AI Agent, ChatGPT, Gemini, Claude]
slug: chat-ai-vs-ai-agent
---

最近「AI Agent」這個詞到處都看得到，但很多人用了好一陣子 ChatGPT，還是不太確定：**我現在用的到底是聊天 AI，還是 Agent？兩者差在哪？**

用一句話說明：

> **Chat AI 是一顆完整的大腦，會思考、會回答，但只能「告訴你」怎麼做。**
> **AI Agent 是幫這顆大腦接上手腳，讓它能「自己動手」把事情做完。**

這篇會用圖和表格說明兩者的差異、各自能做什麼，以及怎麼在 ChatGPT、Gemini、Claude 裡把聊天 AI 升級成能做事的 Agent。

## 用一張圖看懂差別

<div class="flow-compare" markdown="0">
  <div class="flow-card">
    <p class="flow-label">CHAT AI・大腦</p>
    <div class="flow-row">
      <span class="flow-node">你提問</span><span class="flow-arrow">▶</span>
      <span class="flow-node is-brain">AI 思考</span><span class="flow-arrow">▶</span>
      <span class="flow-node">給你答案</span>
    </div>
    <p class="flow-note">最後由<strong>你</strong>照著答案去動手</p>
  </div>
  <div class="flow-card is-agent">
    <p class="flow-label">AI AGENT・大腦＋手腳</p>
    <div class="flow-row">
      <span class="flow-node">你給目標</span><span class="flow-arrow">▶</span>
      <span class="flow-node is-brain">規劃步驟</span><span class="flow-arrow">▶</span>
      <span class="flow-node is-hand">使用工具</span><span class="flow-arrow">▶</span>
      <span class="flow-node is-eye">檢查結果</span>
    </div>
    <p class="flow-loop">↺ 結果不對就修正，重複到完成</p>
    <p class="flow-note">最後交給你的是<strong>完成的成果</strong></p>
  </div>
</div>

關鍵差異就在中間那段**「使用工具 → 檢查結果 → 修正」的迴圈**。Chat AI 回答完就結束，Agent 會自己動手、看結果、發現問題再調整，直到任務完成。

## 差異比較表

| | Chat AI（大腦） | AI Agent（大腦＋手腳） |
| --- | --- | --- |
| **你給它的** | 一個問題 | 一個目標 |
| **它給你的** | 答案、建議、草稿 | 完成的成果（檔案、寄出的信、改好的程式） |
| **誰動手** | 你自己 | AI 自己 |
| **互動方式** | 一問一答，來回對話 | 交代任務後，它自己跑多個步驟 |
| **能碰到的東西** | 只有對話框裡的內容 | 網路、檔案、你的 App、瀏覽器、終端機 |
| **花費時間** | 幾秒鐘 | 幾分鐘到幾十分鐘 |
| **出錯的影響** | 答錯了，你不採用就好 | 做錯了，可能真的寄錯信、改錯檔案 |
| **適合** | 學習、發想、諮詢、寫作 | 重複性工作、跨多個工具的流程 |

## 同一件事，兩種做法

假設你的任務是：**「整理這週所有會議的待辦事項，寄給團隊。」**

**用 Chat AI：**

1. 你打開行事曆，一場一場把會議紀錄複製出來。
2. 貼給 AI，請它整理成待辦清單。
3. 你檢查內容，複製下來。
4. 你打開 Email，貼上、填收件人、寄出。

AI 只幫了第 2 步，其他都是你在做。

**用 AI Agent：**

1. 你說：「整理這週所有會議的待辦事項，寄給團隊，寄出前先讓我看一下。」
2. Agent 自己讀取行事曆、找出會議紀錄、整理待辦、寫好信件草稿。
3. 你確認後，它幫你寄出。

你只負責**下指令**和**最後把關**。

## Agent 是由哪些零件組成的？

一個 AI Agent 通常由四個部分組成：

| 零件 | 比喻 | 實際內容 |
| --- | --- | --- |
| **模型** | 大腦 | 負責理解、規劃、判斷，也就是你平常聊天用的那個 AI |
| **工具** | 手腳 | 網路搜尋、執行程式、操作瀏覽器、讀寫檔案、呼叫 Gmail 或 Slack 等服務 |
| **記憶** | 筆記本 | 記住任務進度、你的偏好、之前做過的事 |
| **迴圈** | 做事的習慣 | 規劃 → 執行 → 觀察結果 → 修正，重複到完成 |

其中最關鍵的是**工具**。同一顆大腦，接上越多工具，能做的事就越多。

這也是為什麼最近常聽到 **MCP（Model Context Protocol）**。它是一個開放標準，可以想成 AI 工具界的「USB 接頭」：只要服務提供 MCP 介面，各家 AI 都能用同一種方式接上去。目前 OpenAI、Google、Anthropic 都支援這套標準。

## 怎麼把 Chat AI 升級成 Agent？三個層次

不需要寫程式，現在三大 AI 都已經內建 Agent 功能，差別只在你**開了多少工具給它**。可以分成三個層次：

### 第 1 層：打開內建工具

最基本的升級。讓 AI 可以自己**上網搜尋、執行程式、產生檔案**。

例如請它「查最新的匯率，算出我這筆日幣換台幣是多少，做成表格」，它會自己搜尋、計算、輸出，而不是叫你自己去查。

### 第 2 層：接上你的服務

透過「連接器」或「外掛」，讓 AI 能讀寫你的 **Gmail、Google 雲端硬碟、行事曆、Slack、GitHub** 等服務。

這一層開始，AI 才真正碰得到「你的資料」，能幫你整理信件、找文件、建立行程。

### 第 3 層：給它行動的環境

讓 AI 能**操作瀏覽器、操作電腦，或在終端機裡改程式**，再加上**排程**讓它定時自動執行。

到這一層，AI 就能幫你填表單、比價、在網站上完成多步驟流程，甚至每天早上自動整理一份報告給你。

!!! warning "權限越大，越要小心"
    層次越高，AI 能做的事越多，出錯時的影響也越大。建議從第 1 層開始，熟悉之後再一步步開放權限。

## 三大 AI 的 Agent 功能怎麼用

| | ChatGPT | Gemini | Claude |
| --- | --- | --- | --- |
| **Agent 入口** | 切換到「Work」模式 | 在輸入框開啟「Agent Mode」 | 直接在對話中使用工具與連接器 |
| **接自己的服務** | 外掛（Slack、Gmail、Drive、GitHub 等） | 原生整合 Gmail、行事曆、Meet 等 Google 服務 | 連接器（Gmail、Google Drive、Slack 等，支援 MCP） |
| **操作瀏覽器** | 桌面版內建瀏覽器 | Gemini in Chrome | Claude in Chrome 擴充功能 |
| **寫程式 Agent** | Codex | Jules | Claude Code |
| **排程任務** | 支援 | 支援 | 支援 |
| **最適合** | 產出完整成果，如報告、簡報、試算表 | 已經重度使用 Google 服務的人 | 開發者、處理長文件與多步驟工作 |

!!! note "功能開放範圍"
    各家 Agent 功能多數需要付費方案，部分功能也依地區分批開放。以下範例以 2026 年 10 月的狀態為準，介面名稱可能隨更新調整。

### ChatGPT：用 Work 模式交付完整成果

ChatGPT 原本的 Agent 模式，在 2026 年 7 月整合成 **Work 模式**，和一般聊天、Codex 並列，可以從模式切換器直接選擇。它的定位是**處理有明確交付物的多步驟任務**，像是整理成試算表、簡報或報告。

接上外掛後，它可以讀取 Slack、Gmail、Google Drive、GitHub 等服務的資料。使用桌面版時，還能存取本機檔案、使用內建瀏覽器。

範例指令：

```text
幫我研究台灣前五大咖啡連鎖品牌的價格與門市數，
整理成一份比較試算表，再做一份 5 頁的簡報摘要。
```

### Gemini：在 Google 服務裡自動處理

Gemini 的優勢是**原生整合 Google 生態系**。在輸入框開啟 **Agent Mode** 後，它可以跨 Gmail、Google 行事曆、Google Meet 等服務完成多步驟任務，例如整理信件、從會議紀錄抓出待辦、規劃行程並寫進行事曆。

另外，Chrome 裡的 Gemini 也能幫你操作網頁；寫程式則有 **Jules** 這個非同步程式 Agent。

範例指令：

```text
找出我這週 Gmail 裡還沒回覆的客戶信件，
依照緊急程度排序，每一封都先幫我擬好回覆草稿。
```

### Claude：用連接器與 Claude Code 動手做

Claude 的 Agent 能力來自**工具和連接器**。在設定中接上 Gmail、Google Drive、Slack 等服務後，直接在對話中交代任務，它就會自己決定要用哪些工具。安裝 **Claude in Chrome** 擴充功能後，它也能操作你的瀏覽器。

對工程師來說，最有感的是 **Claude Code**：它在終端機裡直接讀專案、改程式、跑測試，本身就是一個完整的程式 Agent。安裝方式可以參考我的[Mac 安裝 Claude Code 教學](/posts/install-claude-code-on-mac/)。

範例指令（在 Claude Code 裡）：

```text
幫我找出這個專案裡所有沒有寫測試的 API，
補上單元測試，跑過全部測試後再告訴我改了哪些檔案。
```

## 使用 Agent 的四個安全習慣

Agent 能幫你動手，也代表它可能做錯事。使用時建議養成這幾個習慣：

1. **權限最小化**：只連接這次任務需要的服務。整理信件就不需要開放雲端硬碟。
2. **重要動作要它先問你**：寄信、付款、刪除檔案、發布內容之前，在指令裡加上「執行前先讓我確認」。
3. **小心網頁裡的陷阱**：Agent 瀏覽網頁時，可能讀到惡意網站藏的指令，試圖誘導它做其他事（稱為「提示詞注入」）。避免讓它在不熟悉的網站上，處理帳號、密碼或付款。
4. **檢查成果**：Agent 交出的報告、程式、數據，還是要親自看過一遍，特別是數字和事實。

## 結語：從「問 AI」到「交代 AI」

Chat AI 讓我們學會**問**，AI Agent 則讓我們開始學會**交代**。

兩者沒有誰取代誰：想學習、討論、發想時，聊天就夠了；遇到重複、繁瑣、要跨好幾個工具的工作，就是 Agent 發揮的時候。

建議你從一件每週都要重複做的小事開始，試著交給 Agent 處理一次，就會很快感受到兩者的差別。

如果還不確定該選哪一家 AI，可以參考上一篇〈[ChatGPT、Gemini、Claude 怎麼選？](/posts/chatgpt-gemini-claude-how-to-choose/)〉。

**參考資料**

- [ChatGPT Work 介紹（AIToolsReview）](https://aitoolsreview.co.uk/insights/chatgpt-work)
- [Gemini Agent Mode 介紹（Tom's Guide）](https://www.tomsguide.com/ai/google-just-unlocked-agent-mode-for-gemini-3-1-here-are-7-things-it-can-now-do-for-you)
- [Model Context Protocol 官方網站](https://modelcontextprotocol.io/)
