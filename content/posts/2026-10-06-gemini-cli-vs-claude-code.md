---
title: Gemini CLI 已轉為 Antigravity CLI：和 Claude Code 怎麼選？
description: Google 的終端機 AI 工具 Gemini CLI 在 2026 年 6 月轉型為 Antigravity CLI。這篇整理這次轉換對使用者的影響，並比較它和 Claude Code 的功能差異與適合情境。
date: 2026-10-06 00:40
tags: [AI 應用, Claude Code, Gemini, 工具比較]
slug: gemini-cli-vs-claude-code
---

在終端機裡直接用 AI 寫程式，這兩年最多人討論的兩套工具，就是 Google 的 **Gemini CLI** 和 Anthropic 的 **Claude Code**。

不過如果你最近才想試 Gemini CLI，要先知道一件事：**它已經不是原本的樣子了。**

## 先說重點：Gemini CLI 已轉為 Antigravity CLI

Google 在 2026 年 5 月 19 日公告，將 Gemini CLI 轉換為新的 **Antigravity CLI**：

| 項目 | 內容 |
| --- | --- |
| **生效日期** | 2026 年 6 月 18 日 |
| **停止服務的對象** | 免費使用者，以及 Google AI Pro、Ultra 個人方案使用者 |
| **還能繼續用 Gemini CLI 的人** | 使用付費 Gemini API 金鑰，或 Google 企業方案的使用者 |
| **個人使用者的新選擇** | 改用 Antigravity CLI |
| **保留的功能** | Agent Skills、Hooks、Subagents，以及 Extensions（改為 Antigravity 外掛） |

Google 也說明，Antigravity CLI 初期**不會和 Gemini CLI 的功能完全一致**，從舊工具搬過來需要逐項確認。

所以下面的比較，會把「Gemini CLI（付費 API 版）」和「Antigravity CLI（一般使用者版）」視為同一個 Google 陣營來看。

!!! note "關於這篇比較"
    本文由 Claude 協助整理，比較自家產品難免有立場問題，所以這篇只比較**可查證的功能與規格**，不比較「誰比較聰明」這種主觀評分。

## 功能比較表

| | Google（Gemini CLI／Antigravity CLI） | Claude Code |
| --- | --- | --- |
| **開發商** | Google | Anthropic |
| **個人使用方式** | 用 Google 帳號登入 Antigravity CLI，有免費入門額度，Google AI Pro／Ultra 訂閱可提高額度；付費 API 金鑰可續用 Gemini CLI | Claude Pro、Max、Team、Enterprise 訂閱，或 Console API 帳號 |
| **開源** | Gemini CLI 以 Apache 2.0 授權開源；Antigravity CLI 不開源 | 不開源 |
| **專案說明檔** | `GEMINI.md` | `CLAUDE.md`，也可直接讀取 `AGENTS.md` |
| **上下文長度** | Gemini 模型主打 100 萬 Token | 依模型與方案而定 |
| **內建搜尋** | 內建 Google 搜尋 | 內建網路搜尋與網頁讀取工具 |
| **MCP** | 支援 | 支援 |
| **Skills／Hooks／Subagents** | 支援 | 支援 |
| **非互動模式** | 支援，可輸出 JSON，方便寫成腳本 | 支援 `claude -p` |
| **雲端排程與背景任務** | Antigravity 主打背景執行的 Agent | Routines 可定時、用 API 或 GitHub 事件觸發 |
| **其他介面** | Antigravity 桌面應用程式 | 桌面版、網頁版、VS Code、JetBrains |

可以看到，兩邊的**核心功能已經非常接近**：都有專案說明檔、MCP、Skills、Hooks、Subagents。差異主要在生態系和特色功能。

## 各自的特色

### Google 陣營的特色

- **超長上下文**：Gemini 模型主打百萬 Token 的上下文，適合一次讀進大量檔案做分析。
- **Google 搜尋整合**：查最新文件、API 用法時，直接用 Google 搜尋的結果。
- **Google Cloud 生態系**：如果你的服務架在 GCP 上，整合起來比較順。
- **多模態**：直接處理圖片、PDF 等檔案。

### Claude Code 的特色

- **擴充機制成熟**：CLAUDE.md、Skills、Hooks、Subagents、MCP 的文件和社群資源都很完整。
- **多種使用介面**：終端機、桌面版、網頁版、IDE 擴充，同一個帳號都能用。
- **雲端排程**：Routines 可以讓 Claude Code 在雲端定時執行，或在 GitHub 有新 PR 時自動啟動，相關比較可以看〈[n8n 和 AI 排程任務差在哪](/posts/n8n-vs-ai-scheduled-tasks/)〉。

## 怎麼選？

| 你的情況 | 建議 |
| --- | --- |
| 已經在用 Claude Pro 以上方案 | Claude Code，不用額外付費 |
| 原本用 Gemini CLI 免費版 | 改用 Antigravity CLI，或評估換到 Claude Code |
| 公司服務架在 Google Cloud，且有企業方案 | Gemini CLI（企業版）或 Antigravity CLI |
| 需要一次分析非常大量的檔案 | 可以優先試試 Gemini 的長上下文 |
| 需要雲端排程、GitHub 自動化 | Claude Code 的 Routines |
| 很重視工具開源、可以自己改 | Gemini CLI（但個人使用需要付費 API 金鑰） |

## 我的看法：不要把工作流程綁死在單一工具

Gemini CLI 這次的轉換，其實給所有人上了一課：**AI 工具變化非常快，今天的主力工具，明天可能就改名、改方案，甚至停止服務。**

所以我的建議是：

1. **把功夫花在「可以帶著走」的東西上**：專案說明檔、Skills 都是純文字的 Markdown，概念在各家工具間是共通的。像 Claude Code 已經能直接讀 `AGENTS.md`，Agent Skills 也是一個開放標準，Antigravity CLI 同樣保留了這項功能。把規則寫好，換工具時幾乎可以直接沿用。
2. **兩套都會用，比只精通一套更有價值**：工具的核心概念都一樣，熟悉一套之後，學另一套很快。
3. **依任務選工具，不要選邊站**：大量分析用長上下文，日常開發用最順手的那一套。

工具會換，但「怎麼把需求交代清楚、怎麼讓 AI 熟悉你的專案」這些能力，換到哪套工具都用得上。

**參考資料**

- [Google Developers Blog：Transitioning Gemini CLI to Antigravity CLI](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
- [Gemini CLI（GitHub）](https://github.com/google-gemini/gemini-cli)
- [Google：AI Pro 與 Ultra 訂閱者的 Antigravity 額度提升](https://blog.google/feed/new-antigravity-rate-limits-pro-ultra-subsribers/)
- [The New Stack：Google pushes users from Gemini CLI to Antigravity CLI](https://thenewstack.io/google-antigravity-cli/)
- [Claude Code 官方文件](https://code.claude.com/docs/en/setup)
- [Claude Code 官方文件：How Claude remembers your project](https://code.claude.com/docs/en/memory)
