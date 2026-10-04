---
title: Mac 一步步安裝 Claude Code：把 AI 夥伴接進你的終端機
description: 從打開終端機、安裝、登入到第一次請 AI 改程式碼，一篇帶你在 Mac 上完成 Claude Code 設定，附常見錯誤排解。
date: 2026-10-05
tags: [AI 應用, Claude Code, Mac, 新手教學]
slug: install-claude-code-on-mac
---

最近開發流程裡最大的改變，是把 AI 直接接進終端機。**Claude Code** 是 Anthropic 推出的 AI 開發工具，它不是聊天視窗，而是住在你專案資料夾裡的助手：會自己讀程式碼、改檔案、跑指令，再把結果回報給你。

這篇把 Mac 上從零安裝到第一次實際使用的過程整理成步驟，就算平常很少開終端機，也能照著做完。

!!! note "撰寫基準"
    本文依據 2026 年 10 月的 [Claude Code 官方文件](https://code.claude.com/docs/en/setup)撰寫。工具更新很快，如果畫面或指令和文中不同，請以官方文件為準。

## 開始之前：先確認這三件事

| 項目 | 需求 |
| --- | --- |
| 系統 | macOS 13.0（Ventura）以上，Intel 或 Apple 晶片都可以 |
| 硬體 | 4 GB 以上記憶體，需要網路連線 |
| 帳號 | Claude **Pro、Max、Team、Enterprise** 訂閱，或 Claude Console（API 預付額度）帳號 |

!!! warning "免費方案不能用"
    claude.ai 的免費方案不包含 Claude Code。如果你只有免費帳號，需要先升級訂閱，或改用 Console 帳號以 API 用量計費。

想確認自己的 macOS 版本，點左上角 **蘋果選單 → 關於這台 Mac** 就能看到。

## Step 1：打開終端機

按 <kbd>⌘ Command</kbd> + <kbd>Space</kbd> 叫出 Spotlight，輸入「終端機」或 `Terminal`，按 <kbd>Enter</kbd>。

看到一個有游標在閃的視窗就對了，接下來的指令都貼在這裡執行。

## Step 2：安裝 Claude Code

官方提供幾種安裝方式，**新手直接選第一種就好**。

### 方式 A：官方安裝腳本（推薦）

把下面這行貼進終端機，按 <kbd>Enter</kbd>：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

這個方式最大的好處是**會在背景自動更新**，之後不用自己管版本。

### 方式 B：Homebrew

如果你本來就用 Homebrew 管理軟體，也可以這樣裝：

```bash
brew install --cask claude-code
```

Homebrew 有兩個版本可選：

- `claude-code`：穩定版，通常比最新版晚一週左右，會跳過有重大問題的版本。
- `claude-code@latest`：最新版，有新功能會第一時間拿到。

要注意 Homebrew 版本**不會自動更新**，記得定期執行 `brew upgrade claude-code`。

### 方式 C：npm

如果你是前端工程師、電腦裡已經有 Node.js 22 以上，也可以用 npm：

```bash
npm install -g @anthropic-ai/claude-code
```

!!! warning "不要加 sudo"
    官方特別提醒不要用 `sudo npm install -g` 安裝，可能造成權限問題和安全風險。如果遇到權限錯誤，請改用方式 A，或參考官方的權限排解說明。

## Step 3：確認安裝成功

安裝完成後，**先關掉終端機、再開一個新的視窗**（讓系統讀到新的路徑設定），然後輸入：

```bash
claude --version
```

有出現版本號，例如 `2.1.xxx (Claude Code)`，就代表安裝成功。

想做更完整的健康檢查，可以跑：

```bash
claude doctor
```

它會列出安裝狀態、設定檔有沒有錯誤，以及自動更新是否正常，不會啟動對話，可以放心執行。

### 出現 command not found: claude 怎麼辦？

這代表系統找不到 `claude` 指令，通常是安裝路徑還沒加進 PATH。官方腳本會把程式放在 `~/.local/bin`，Mac 預設的 zsh 可以這樣補上：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

再執行一次 `claude --version` 應該就正常了。如果還是不行，可以對照官方的[安裝疑難排解](https://code.claude.com/docs/en/troubleshoot-install)。

## Step 4：登入帳號

先用 `cd` 移動到你想讓 Claude 幫忙的專案資料夾，再啟動 Claude Code：

```bash
cd ~/Projects/my-app
claude
```

第一次啟動會引導你登入，跟著畫面操作，它會開啟瀏覽器讓你登入 Claude 帳號並授權。完成後回到終端機，就會看到 Claude Code 的輸入介面，上方會顯示版本、目前使用的模型和工作資料夾。

登入資訊會被保存下來，之後不用每次重新登入。想切換帳號時，在 Claude Code 裡輸入 `/login` 即可。

!!! tip "用 API Key 登入"
    如果你有設定 `ANTHROPIC_API_KEY` 環境變數，Claude Code 會略過瀏覽器登入，改成請你確認是否使用這把金鑰，費用會從 Console 的 API 額度扣。

## Step 5：第一次跟 Claude 對話

進到介面後，直接用中文打字就可以。建議先從「理解專案」開始，讓它熟悉你的程式碼：

```text
這個專案在做什麼？用了哪些技術？
```

```text
幫我說明資料夾結構，主程式的入口在哪裡？
```

你不需要手動貼程式碼給它，Claude Code 會自己去讀需要的檔案。

### 請它改第一段程式碼

熟悉之後，試著交代一個小任務：

```text
在主程式加一個 hello world 函式，並寫一個簡單的測試
```

Claude 會找到適合的檔案、做出修改並告訴你改了什麼。

### 誰來決定要不要執行？權限模式

Claude Code 會修改檔案、執行指令，所以有「權限模式」決定哪些動作要先問過你。依版本和方案不同，預設可能是每次都詢問，或是由系統自動判斷大部分動作是否安全。

如果想切換模式，隨時按 <kbd>Shift</kbd> + <kbd>Tab</kbd> 就能輪流切換。新手建議一開始保守一點，**看得懂它要做什麼再按同意**，等熟悉了再放手。

### 用 /init 建立專案說明檔

在專案裡輸入：

```text
/init
```

Claude 會掃描專案，產生一份 `CLAUDE.md`，記錄這個專案的架構、常用指令和開發慣例。之後每次啟動都會先讀這份檔案，回答會更貼近你的專案。你也可以自己編輯它，例如寫上「commit 訊息用繁體中文」「測試指令是 `npm test`」。

## 常用指令速查

在終端機啟動時：

| 指令 | 用途 |
| --- | --- |
| `claude` | 啟動互動模式 |
| `claude "修好 build 錯誤"` | 啟動並直接交代第一個任務 |
| `claude -p "解釋這個函式"` | 只問一次、回答完就結束 |
| `claude -c` | 接續這個資料夾最近一次的對話 |
| `claude -r` | 從清單挑一段過去的對話繼續 |

在 Claude Code 裡面：

| 指令／按鍵 | 用途 |
| --- | --- |
| `/help` | 列出所有可用指令 |
| `/clear` | 清除目前的對話紀錄，重新開始 |
| `/login` | 切換帳號或重新登入 |
| `/exit` 或連按兩次 <kbd>Ctrl</kbd> + <kbd>D</kbd> | 離開 Claude Code |
| 輸入 `/` | 顯示可用的指令與技能 |
| <kbd>Shift</kbd> + <kbd>Tab</kbd> | 切換權限模式 |
| <kbd>↑</kbd> | 叫出之前輸入過的內容 |

## 讓 Claude 更好用的三個習慣

**1. 講清楚，不要只說「修 bug」**

比起「修好登入的 bug」，改成「使用者輸入錯誤密碼後畫面變成空白，請找出原因並修正」，Claude 能更快找到問題。

**2. 大任務拆成步驟**

```text
1. 建立使用者個人資料的資料表
2. 做一個讀取和更新個人資料的 API
3. 做一個可以查看、編輯個人資料的頁面
```

**3. 先讓它看，再讓它改**

動手前先請它分析，例如「先分析資料庫結構，告訴我你打算怎麼改，先不要修改檔案」，確認方向沒錯再執行，可以少走很多冤枉路。

它也很擅長 Git 操作，像是「我改了哪些檔案？」「幫我用清楚的訊息 commit」「開一個 feature/login 分支」，都可以直接用講的。

## 更新與移除

**更新**：官方腳本安裝的版本會自動更新；想馬上更新可以執行：

```bash
claude update
```

Homebrew 安裝的請用 `brew upgrade claude-code`，npm 安裝的請用 `npm install -g @anthropic-ai/claude-code@latest`。

**移除**（以官方腳本安裝為例）：

```bash
rm -f ~/.local/bin/claude
rm -rf ~/.local/share/claude
```

如果連設定和對話紀錄都要清掉，再刪除 `~/.claude` 資料夾和 `~/.claude.json`。這會刪掉所有設定，請確定不需要了再執行。

## 不想用終端機？還有桌面版

如果你對終端機真的不熟，Claude Code 也有 **Desktop 桌面應用程式**，以及 VS Code、JetBrains 的擴充套件，功能相同、介面更直覺。不過把終端機版裝起來還是很值得，很多進階用法都從這裡開始。

## 結語

整個流程其實只有三件事：**一行指令安裝、`claude` 登入、在專案裡開始對話**。裝好之後，建議先拿一個小專案練習，請它解釋程式、補測試、整理 README，慢慢抓到怎麼跟它合作的節奏。

之後會陸續分享實際用 Claude Code 完成的開發案例，看看它在真實專案裡能幫上多少忙。

**參考資料**

- [Claude Code 官方文件：安裝與設定](https://code.claude.com/docs/en/setup)
- [Claude Code 官方文件：快速開始](https://code.claude.com/docs/en/quickstart)
