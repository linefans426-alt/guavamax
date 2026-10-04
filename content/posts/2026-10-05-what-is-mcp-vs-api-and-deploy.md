---
title: MCP 是什麼？和 API 差在哪、怎麼選，再一步步部署自己的 MCP Server
description: MCP 讓 AI 用統一的方式接上各種工具與資料。本文用表格比較 MCP 與 API 的差異與選擇方式，並用 Python 實作一個 MCP Server，從本機測試一路部署到自己的伺服器。
date: 2026-10-05 01:50
tags: [AI 應用, MCP, AI Agent, Python, 部署]
slug: what-is-mcp-vs-api-and-deploy
---

上一篇〈[Chat AI 和 AI Agent 差在哪？](/posts/chat-ai-vs-ai-agent/)〉提到，AI 要從「會說」變成「會做」，關鍵是幫它接上工具，而目前最主流的接法就是 **MCP**。

這篇會把 MCP 一次講清楚：

1. MCP 是什麼、解決了什麼問題
2. MCP 和 API 差在哪，什麼時候該選哪一個
3. 用 Python 寫一個自己的 MCP Server
4. 部署到自己的伺服器，讓 AI 從任何地方都能使用

前半段不需要程式背景，後半段的實作適合有基本 Python 和 Linux 經驗的讀者。

!!! note "撰寫基準"
    本文程式碼使用 MCP 官方 Python SDK 2.x 版，並已實際執行測試過。MCP 規格和 SDK 都還在快速演進，若指令和你看到的不同，請以[官方文件](https://modelcontextprotocol.io/)為準。

## MCP 是什麼？

**MCP（Model Context Protocol）** 是由 Anthropic 提出的開放標準，用來規範「AI 應用程式」和「外部工具、資料」之間要怎麼溝通。現在 OpenAI、Google 等主要廠商也都支援。

最常見的比喻是：**MCP 是 AI 世界的 USB-C**。

在 USB-C 出現之前，每台裝置都有自己的接頭，換一台設備就要換一條線。MCP 出現之前，AI 工具的世界也是這樣：

- 想讓 ChatGPT 讀 Notion，要寫一套串接。
- 想讓 Claude 讀 Notion，又要另外寫一套。
- 想讓 Claude 讀 GitHub，再寫一套。

假設有 5 個 AI 應用、10 個服務，最糟要寫 5 × 10 = 50 套串接。有了 MCP，每個服務只要做一次 MCP Server，每個 AI 應用只要支援一次 MCP，就能全部互通，變成 5 + 10 = 15 份工作。

### MCP 的三個角色

| 角色 | 是什麼 | 例子 |
| --- | --- | --- |
| **Host（主程式）** | 使用者實際操作的 AI 應用 | Claude Desktop、Claude Code、ChatGPT |
| **Client（用戶端）** | Host 裡負責連線的元件，一個 Client 對應一個 Server | 通常內建在 Host 裡，不用自己處理 |
| **Server（伺服器）** | 把工具和資料包裝成 MCP 格式提供出去 | Notion MCP、GitHub MCP，或你自己寫的 |

### Server 能提供的三種東西

| 類型 | 用途 | 例子 |
| --- | --- | --- |
| **Tools（工具）** | 讓 AI 執行動作，最常用 | 搜尋訂單、新增筆記、寄送通知 |
| **Resources（資源）** | 讓 AI 讀取資料 | 文件內容、資料表、設定檔 |
| **Prompts（提示範本）** | 預先寫好的指令範本 | 「用公司格式產生週報」 |

## MCP 和 API 差在哪？

很多人第一次看到 MCP 會問：「這不就是 API 嗎？」

其實 MCP **通常是蓋在 API 之上的一層**。你的服務本來就有 API，MCP Server 是把這些 API 包裝成「AI 看得懂、知道什麼時候該用」的形式。

用比喻來說：**API 是廚房的出餐口，MCP 是附上照片和說明的菜單。**工程師看文件就知道怎麼呼叫 API，但 AI 需要一份清楚的菜單，才知道有哪些工具、各自做什麼、要給什麼參數。

| | API | MCP |
| --- | --- | --- |
| **設計給誰用** | 程式、工程師 | AI 模型 |
| **怎麼知道能做什麼** | 工程師讀 API 文件 | AI 連線後自動取得工具清單和說明 |
| **格式** | 每個服務都不一樣（REST、GraphQL…） | 統一的協定（底層是 JSON-RPC） |
| **由誰決定呼叫** | 程式碼寫死的流程 | AI 依照對話內容自己判斷 |
| **結果是否固定** | 同樣輸入，同樣流程 | AI 每次的判斷可能不同 |
| **速度與成本** | 直接呼叫，最快最省 | 多了 AI 判斷的時間與費用 |
| **適合的流量** | 大量、高頻的請求 | 人與 AI 對話時的互動 |
| **串接一次能給誰用** | 只有你寫的那支程式 | 所有支援 MCP 的 AI 應用 |

## 什麼時候用 API？什麼時候用 MCP？

判斷方式其實很簡單：**這件事的流程是固定的，還是需要 AI 判斷？**

### 選 API 的情況

- **流程固定**：例如「每筆訂單成立後，自動開發票」，每次步驟都一樣，不需要 AI 思考。
- **大量、高頻**：每秒幾百次的請求，交給 AI 判斷既慢又貴。
- **要求結果完全一致**：金流、扣庫存這類不能有任何意外的操作。
- **給一般程式或前端使用**：根本沒有 AI 參與。

### 選 MCP 的情況

- **想讓 AI 助理使用你的服務**：例如讓 Claude 或 ChatGPT 查詢你公司的訂單、知識庫。
- **需求很彈性**：使用者會用各種方式提問，很難事先寫死流程。
- **想讓多個 AI 工具共用**：做一次 MCP Server，Claude、ChatGPT 等工具都能接。
- **打造內部 AI 工作流程**：讓同事用自然語言查資料、跑報表。

### 實務上：兩個一起用

大部分情況不是二選一。常見的架構是：

```text
你的服務 ─ API ─┬─ 網站、App、排程程式（固定流程）
                └─ MCP Server ─ Claude / ChatGPT / 其他 AI（彈性需求）
```

**API 是地基，MCP 是給 AI 的入口。**已經有 API 的服務，只要加一層薄薄的 MCP Server 就能讓 AI 使用。

## 實作：用 Python 寫一個 MCP Server

接下來做一個簡單的「筆記」MCP Server，提供兩個工具：**新增筆記**和**搜尋筆記**。做好之後，你就能對 AI 說「幫我記下週五要交報告」，它會自己呼叫工具存起來。

### Step 1：建立專案

官方推薦用 [uv](https://docs.astral.sh/uv/) 管理 Python 專案。還沒安裝的話，先執行：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

建立專案並安裝 MCP SDK：

```bash
uv init guava-notes
cd guava-notes
uv add "mcp[cli]"
```

### Step 2：寫 Server 程式

建立 `server.py`：

```python
import json
import logging
import os
from datetime import datetime
from pathlib import Path

from mcp.server import MCPServer

logger = logging.getLogger(__name__)

NOTES_FILE = Path(os.environ.get("NOTES_FILE", "notes.json"))

mcp = MCPServer("guava-notes")


def load_notes() -> list[dict]:
    if NOTES_FILE.exists():
        return json.loads(NOTES_FILE.read_text(encoding="utf-8"))
    return []


def save_notes(notes: list[dict]) -> None:
    NOTES_FILE.write_text(json.dumps(notes, ensure_ascii=False, indent=2), encoding="utf-8")


@mcp.tool()
def add_note(title: str, content: str) -> str:
    """新增一則筆記。

    Args:
        title: 筆記標題
        content: 筆記內容
    """
    notes = load_notes()
    notes.append({
        "id": len(notes) + 1,
        "title": title,
        "content": content,
        "created_at": datetime.now().isoformat(timespec="seconds"),
    })
    save_notes(notes)
    logger.info("added note %s", title)
    return f"已新增筆記 #{len(notes)}：{title}"


@mcp.tool()
def search_notes(keyword: str) -> str:
    """用關鍵字搜尋筆記的標題與內容。

    Args:
        keyword: 要搜尋的關鍵字
    """
    hits = [n for n in load_notes() if keyword in n["title"] or keyword in n["content"]]
    if not hits:
        return f"找不到包含「{keyword}」的筆記。"
    return "\n".join(f"#{n['id']} {n['title']}：{n['content']}" for n in hits)


if __name__ == "__main__":
    mcp.run()
```

幾個重點：

- **`@mcp.tool()`** 一行就把普通的 Python 函式變成 AI 能用的工具。
- **函式說明（docstring）非常重要**。AI 是靠這段文字判斷「什麼時候該用這個工具」，寫得越清楚，AI 用得越準。
- **型別提示**（`title: str`）會自動轉成參數規格，AI 就知道要傳什麼。
- **不要用 `print()`**。本機模式下，MCP 是透過標準輸出（stdout）傳遞訊息，`print()` 會把通訊內容弄亂。要記錄 log 請用 `logging`，它預設寫到 stderr。

### Step 3：在本機接上 Claude Code 測試

`mcp.run()` 預設使用 **stdio** 模式：AI 應用會把你的程式當成子程序啟動，透過標準輸入輸出溝通，不需要開任何網路連接埠，最適合本機開發。

在 Claude Code 加入這個 Server：

```bash
claude mcp add guava-notes -- uv --directory /你的絕對路徑/guava-notes run server.py
```

`--` 後面就是啟動 Server 的指令。接著啟動 `claude`，輸入 `/mcp` 檢查連線狀態，看到 `✔ Connected` 就成功了。

現在試著說：

```text
幫我記一則筆記：週五下午三點前要交季報
```

Claude 會呼叫 `add_note` 工具，再問它「我有哪些跟季報有關的筆記？」，它就會改用 `search_notes`。

!!! tip "用 Claude Desktop 測試"
    如果你用的是 Claude Desktop，可以編輯 `~/Library/Application Support/Claude/claude_desktop_config.json`，在 `mcpServers` 裡加入同樣的啟動指令，存檔後重新開啟 App。

## 部署：讓 MCP Server 上線

stdio 模式只能在自己電腦上用。如果想讓**網頁版 AI、手機、其他同事**也能使用，就要把 Server 部署成 **Streamable HTTP** 模式，放到有網址的伺服器上。

### 兩種模式比較

| | stdio（本機） | Streamable HTTP（遠端） |
| --- | --- | --- |
| **運作方式** | AI 應用直接啟動你的程式 | 你的程式是一個網路服務 |
| **誰能用** | 只有這台電腦 | 任何拿到網址和金鑰的人 |
| **需要網址、HTTPS** | 不需要 | 需要 |
| **需要驗證** | 不需要 | 一定要 |
| **適合** | 個人開發、存取本機檔案 | 團隊共用、雲端服務 |

### Step 4：加上 HTTP 入口與身分驗證

**部署到公開網路的 MCP Server 一定要加驗證**，否則任何人都能呼叫你的工具。這裡示範最簡單的 Bearer Token 驗證，在同一個資料夾新增 `http_app.py`：

```python
import hmac
import os

from mcp.server.transport_security import TransportSecuritySettings

from server import mcp

TOKEN = os.environ["MCP_TOKEN"]
DOMAIN = os.environ.get("MCP_DOMAIN", "mcp.example.com")

# 只接受來自你自己網域的請求
security = TransportSecuritySettings(
    allowed_hosts=[DOMAIN, f"{DOMAIN}:*", "127.0.0.1:*", "localhost:*"],
)
mcp_app = mcp.streamable_http_app(transport_security=security)


async def app(scope, receive, send):
    """檢查 Authorization: Bearer <token>，沒帶對就回 401。"""
    if scope["type"] == "http":
        headers = dict(scope["headers"])
        given = headers.get(b"authorization", b"")
        if not hmac.compare_digest(given, f"Bearer {TOKEN}".encode()):
            await send({"type": "http.response.start", "status": 401,
                        "headers": [(b"content-type", b"text/plain")]})
            await send({"type": "http.response.body", "body": b"Unauthorized"})
            return
    await mcp_app(scope, receive, send)
```

說明：

- **`streamable_http_app()`** 會把 Server 轉成標準的 ASGI 網頁應用程式，MCP 的入口預設在 `/mcp`。
- **`allowed_hosts`** 是 SDK 內建的防護，預設只接受 localhost 的請求，部署時要把你的網域加進來，否則會收到 `421` 錯誤。
- 外層的 `app` 會先檢查請求是否帶了正確的 Token，用 `hmac.compare_digest` 比對可以避免時間差攻擊。

先在本機啟動看看：

```bash
uv add uvicorn
MCP_TOKEN=換成一串很長的亂碼 uv run uvicorn http_app:app --port 8000
```

產生隨機 Token 可以用 `openssl rand -hex 32`。

### Step 5：部署到 Linux 伺服器

以下以 Ubuntu 為例，假設網域是 `mcp.example.com`。

**① 上傳程式並安裝套件**

把專案放到伺服器，例如 `/opt/guava-notes`，在資料夾內執行 `uv sync` 安裝套件。

**② 用 systemd 讓服務常駐**

建立 `/etc/systemd/system/guava-notes.service`：

```ini
[Unit]
Description=Guava Notes MCP Server
After=network.target

[Service]
WorkingDirectory=/opt/guava-notes
Environment=MCP_TOKEN=你的Token
Environment=MCP_DOMAIN=mcp.example.com
Environment=NOTES_FILE=/opt/guava-notes/notes.json
ExecStart=/root/.local/bin/uv run uvicorn http_app:app --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips=127.0.0.1
Restart=always

[Install]
WantedBy=multi-user.target
```

`uv` 的路徑請用 `which uv` 確認。接著啟動服務：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now guava-notes
sudo systemctl status guava-notes
```

服務只監聽 `127.0.0.1`，外部無法直接連，要透過下一步的 Nginx 轉發。

**③ 用 Nginx 反向代理並加上 HTTPS**

DNS 新增一筆 `mcp` 的 A 記錄指向伺服器，Nginx 設定如下：

```nginx
server {
    listen 443 ssl;
    server_name mcp.example.com;

    ssl_certificate     /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

`proxy_buffering off` 很重要，MCP 會用串流方式回傳結果，開著緩衝會讓回應卡住。憑證可以用 Let's Encrypt 的 certbot 免費申請。

!!! tip "用寶塔面板的話"
    新增站點後，在「SSL」申請 Let's Encrypt 憑證，再到「反向代理」新增目標 `http://127.0.0.1:8000`。如果串流回應會卡住，到設定檔裡補上 `proxy_buffering off;`。

### Step 6：從 AI 連上遠端 MCP Server

部署完成後，在 Claude Code 加入遠端 Server：

```bash
claude mcp add --transport http guava-notes https://mcp.example.com/mcp \
  --header "Authorization: Bearer 你的Token"
```

想讓整個專案的成員共用，可以加上 `--scope project`，設定會寫進專案根目錄的 `.mcp.json`，跟著 Git 一起分享。Token 不要直接寫進檔案，可以在 `.mcp.json` 裡用 `${MCP_TOKEN}` 讀取環境變數。

!!! note "網頁版 AI 的連接器"
    Claude、ChatGPT 的網頁版也能加入自訂的遠端 MCP Server，但通常要求使用 **OAuth 登入**的驗證方式。本文的 Bearer Token 適合 Claude Code 這類可以自訂 Header 的用戶端；若要開放給網頁版使用，需要再實作 OAuth，或參考 SDK 文件的驗證章節。

## 使用 MCP 的安全提醒

MCP 讓 AI 能動手做事，也帶來新的風險：

1. **只安裝信任來源的 MCP Server**：Server 能執行任意程式，來路不明的 Server 等同在電腦上裝了陌生軟體。
2. **工具權限最小化**：能唯讀就不要給寫入權限；刪除、付款這類動作，最好要求 AI 先跟你確認。
3. **小心提示詞注入**：工具回傳的內容（例如網頁、信件）可能藏有惡意指令，試圖讓 AI 做其他事。
4. **金鑰不要寫死在程式碼或 Git 裡**：一律用環境變數管理，外洩時才能快速更換。

## 結語

整理一下這篇的重點：

- **MCP 是讓 AI 接上工具的統一標準**，做一次就能讓各家 AI 使用。
- **API 給程式用，MCP 給 AI 用**。固定流程、高流量用 API；需要 AI 彈性判斷時用 MCP，而且通常是在 API 之上再包一層 MCP。
- **本機用 stdio，遠端用 Streamable HTTP**，部署到公開網路時一定要加驗證和 HTTPS。

用 Python 寫一個 MCP Server 不用一百行程式碼，最難的反而是**想清楚要給 AI 哪些工具**。建議從你每天最常手動查詢的資料開始，包成一兩個工具試試看。

**參考資料**

- [Model Context Protocol 官方文件](https://modelcontextprotocol.io/)
- [官方教學：Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server)
- [MCP Python SDK 文件](https://py.sdk.modelcontextprotocol.io/)
- [Claude Code：連接 MCP 伺服器](https://code.claude.com/docs/en/mcp)
