#!/usr/bin/env python3
"""GUAVAMAX 靜態網站產生器。

用法：
    pip install markdown pygments
    python build.py            # 輸出到 dist/
    python build.py --serve    # 輸出後在 http://localhost:8000 預覽

內容放在 content/posts/*.md（開頭為 front matter），
靜態檔放在 static/，樣式與腳本在 src/。
"""

from __future__ import annotations

import html
import json
import math
import re
import shutil
import sys
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = Path(__file__).parent
CONTENT = ROOT / "content"
STATIC = ROOT / "static"
SRC = ROOT / "src"
DIST = ROOT / "dist"

SITE = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
BUILD_ID = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
# 文章的 date 一律視為台灣時間；date 在未來的文章視為「排程中」，時間到才發布
NOW_LOCAL = datetime.now(ZoneInfo("Asia/Taipei")).replace(tzinfo=None)

esc = html.escape


# ─────────────────────────── 像素芭樂圖示 ───────────────────────────

GUAVA_SPRITE = [
    "........KK......",
    ".......KGGK.....",
    "......KGGK......",
    "....KKKKKKKK....",
    "...KDDDDDDDDK...",
    "..KDGGGGGGGGDK..",
    ".KDGPPPPPPPPGDK.",
    ".KDGPPLPPSPPGDK.",
    "KDGPPSPPPPPLPGDK",
    "KDGPPPPLSPPPPGDK",
    "KDGPLPPPPPSPPGDK",
    ".KDGPPSPPLPPGDK.",
    ".KDGPPPPPPPPGDK.",
    "..KDGGGGGGGGDK..",
    "...KDDDDDDDDK...",
    "....KKKKKKKK....",
]
SPRITE_COLORS = {
    "K": "#241a3a",
    "D": "#008751",
    "G": "#00e436",
    "P": "#ff77a8",
    "L": "#ffccaa",
    "S": "#7e2553",
}


def mirror(halves: list[str]) -> list[str]:
    return [h + h[::-1] for h in halves]


BUG_SPRITE = mirror([
    "..K.....",
    "...K....",
    "....KKKK",
    "....KWKK",
    ".....KKK",
    "...KKRRK",
    "..KRRRRK",
    "KKKRSRRK",
    "..KRRRRK",
    "KKKRRSRK",
    "..KRRRRK",
    "KKKRSRRK",
    "...KRRRK",
    "....KKKK",
    "........",
    "........",
])
BUG_COLORS = {"K": "#241a3a", "R": "#ff004d", "S": "#7e2553", "W": "#fff1e8"}
BRICK_SPRITE = [
    "................",
    ".RRRRRR.OOOOOOO.",
    ".RRRRRR.OOOOOOO.",
    "................",
    "YYY.LLLLLLL.BBBB",
    "YYY.LLLLLLL.BBBB",
    "................",
    ".PPPPPP.GGGGGGG.",
    ".PPPPPP.GGGGGGG.",
    "................",
    "................",
    "........WW......",
    "........WW......",
    "................",
    "....QQQQQQQQ....",
    "....QQQQQQQQ....",
]
BRICK_COLORS = {"R": "#ff004d", "O": "#ffa300", "Y": "#ffec27", "L": "#00e436", "B": "#29adff",
                "P": "#ff77a8", "G": "#008751", "W": "#fff1e8", "Q": "#ff77a8"}
SPIT_SPRITE = [
    "......GG........",
    ".....GG.........",
    "....KKKKKK......",
    "...KDDDDDDK.....",
    "..KDPPPPPPDK....",
    "..KDPWKPWKDK....",
    "..KDPPPPPPDK....",
    "..KDPPKKPPDK....",
    "...KDPPPPDK.....",
    "....KKKKKK......",
    "......Y.........",
    "....Y...Y.......",
    "..BBBB..Y...CCCC",
    "..BBBB.....YCCCC",
    "...........Y....",
    "......Y.........",
]
SPIT_COLORS = {"G": "#00e436", "K": "#241a3a", "D": "#008751", "P": "#ff77a8", "W": "#fff1e8",
               "Y": "#ffccaa", "B": "#29adff", "C": "#00e436"}
COVERS = {"guava": (GUAVA_SPRITE, SPRITE_COLORS), "bug": (BUG_SPRITE, BUG_COLORS),
          "spit": (SPIT_SPRITE, SPIT_COLORS),
          "bricks": (BRICK_SPRITE, BRICK_COLORS)}


def sprite_svg(rows: list[str], colors: dict[str, str], title: str = "") -> str:
    rects = []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            ch = row[x]
            run = 1
            while x + run < len(row) and row[x + run] == ch:
                run += 1
            if ch in colors:
                rects.append(
                    f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="{colors[ch]}"/>'
                )
            x += run
    w, h = len(rows[0]), len(rows)
    t = f"<title>{esc(title)}</title>" if title else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'shape-rendering="crispEdges">{t}{"".join(rects)}</svg>'
    )


# ─────────────────────────── 文章 ───────────────────────────

@dataclass
class Post:
    slug: str
    title: str
    description: str
    date: date
    tags: list[str]
    body_html: str
    toc_html: str
    minutes: int
    updated: date | None = None
    draft: bool = False
    extra: dict = field(default_factory=dict)

    @property
    def url(self) -> str:
        return f"/posts/{self.slug}/"


def parse_front_matter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    _, fm, body = text.split("---", 2)
    meta: dict = {}
    for line in fm.strip().splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key.strip()] = [v.strip().strip("\"'") for v in value[1:-1].split(",") if v.strip()]
        else:
            meta[key.strip()] = value.strip("\"'")
    return meta, body


def reading_minutes(md_text: str) -> int:
    cjk = len(re.findall(r"[一-鿿]", md_text))
    words = len(re.findall(r"[A-Za-z0-9_]+", md_text))
    return max(1, math.ceil(cjk / 450 + words / 220))


def make_md() -> markdown.Markdown:
    return markdown.Markdown(
        extensions=[
            "fenced_code",
            "tables",
            "admonition",
            "attr_list",
            "md_in_html",
            "codehilite",
            "toc",
        ],
        extension_configs={
            "codehilite": {"css_class": "highlight", "guess_lang": False},
            "toc": {"slugify": slugify_unicode, "toc_depth": "2"},
        },
    )


def load_posts(drafts: bool = False) -> list[Post]:
    """drafts=False 回傳已發布文章；drafts=True 只回傳草稿。"""
    posts = []
    for path in sorted((CONTENT / "posts").glob("*.md")):
        meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
        md = make_md()
        body_html = md.convert(body)
        body_html = enhance_html(body_html)
        posts.append(
            Post(
                slug=meta.get("slug") or path.stem,
                title=meta["title"],
                description=meta.get("description", ""),
                date=datetime.fromisoformat(meta["date"]).date(),
                extra={"sort": datetime.fromisoformat(meta["date"])},
                updated=date.fromisoformat(meta["updated"]) if meta.get("updated") else None,
                tags=meta.get("tags", []),
                draft=str(meta.get("draft", "")).lower() == "true",
                body_html=body_html,
                toc_html=md.toc,
                minutes=reading_minutes(body),
            )
        )
    for p in posts:
        p.extra["scheduled"] = not p.draft and p.extra["sort"] > NOW_LOCAL
    if drafts:
        posts = [p for p in posts if p.draft or p.extra["scheduled"]]
    else:
        posts = [p for p in posts if not p.draft and not p.extra["scheduled"]]
    # date 可寫成 2026-10-05 或 2026-10-05 14:30，同一天的文章依時間排序
    posts.sort(key=lambda p: p.extra["sort"], reverse=True)
    return posts


@dataclass
class Game:
    slug: str
    title: str
    title_en: str
    description: str
    script: str
    cover: str
    portrait: bool
    controls: list[str]
    order: int
    body_html: str

    @property
    def url(self) -> str:
        return f"/arcade/{self.slug}/"


def load_games() -> list[Game]:
    games = []
    for path in sorted((CONTENT / "games").glob("*.md")):
        meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
        if str(meta.get("draft", "")).lower() == "true":
            continue
        games.append(Game(
            slug=meta.get("slug") or path.stem,
            title=meta["title"],
            title_en=meta.get("title_en", ""),
            description=meta.get("description", ""),
            script=meta["script"],
            cover=meta.get("cover", "guava"),
            portrait=str(meta.get("portrait", "")).lower() == "true",
            controls=meta.get("controls", []),
            order=int(meta.get("order", 99)),
            body_html=enhance_html(make_md().convert(body)),
        ))
    games.sort(key=lambda g: g.order)
    return games


def enhance_html(body: str) -> str:
    # 程式碼區塊外包一層，加上「複製」按鈕
    body = re.sub(
        r'<div class="highlight">',
        '<div class="code-block"><button class="copy-btn" type="button" aria-label="複製程式碼">COPY</button><div class="highlight">',
        body,
    )
    body = re.sub(r"(<div class=\"highlight\">.*?</pre></div>)", r"\1</div>", body, flags=re.S)
    # 表格可橫向捲動
    body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
    # 外部連結開新分頁
    body = re.sub(
        r'<a href="(https?://(?!blog\.guavamax\.com)[^"]+)"',
        r'<a href="\1" target="_blank" rel="noopener"',
        body,
    )
    return body


# ─────────────────────────── 版型 ───────────────────────────

NAV = [("/posts/", "文章", "POSTS"), ("/arcade/", "遊戲", "ARCADE"), ("/about/", "關於", "ABOUT")]


def fmt_date(d: date) -> str:
    return d.strftime("%Y.%m.%d")


def layout(*, title: str, description: str, path: str, body: str, og_type: str = "website",
           head_extra: str = "", body_class: str = "", noindex: bool = False) -> str:
    full_title = f"{title}｜{SITE['title']}" if title != SITE["title"] else f"{SITE['title']}｜{SITE['subtitle']}"
    canonical = SITE["url"] + path
    adsense = ""
    if noindex:
        head_extra = '<meta name="robots" content="noindex, nofollow">' + head_extra
    if SITE.get("adsense_client") and not noindex:
        adsense = (
            '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
            f'?client={esc(SITE["adsense_client"])}" crossorigin="anonymous"></script>'
        )
    nav_items = "".join(
        f'<a class="nav-link{" is-active" if path.startswith(href) else ""}" href="{href}">'
        f'<span class="nav-en">{en}</span><span class="nav-zh">{zh}</span></a>'
        for href, zh, en in NAV
    )
    logo = sprite_svg(GUAVA_SPRITE, SPRITE_COLORS)
    return f"""<!doctype html>
<html lang="{SITE['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="{SITE['title']}">
<meta property="og:locale" content="zh_TW">
<meta property="og:image" content="{SITE['url']}/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1d2b53">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="{SITE['title']}" href="/feed.xml">
<link rel="preload" href="/fonts/Cubic_11.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v={BUILD_ID}">
<script>try{{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;}}catch(e){{}}</script>
{adsense}
{head_extra}
</head>
<body class="{body_class}">
<a class="skip-link" href="#main">跳到主要內容</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="{SITE['title']} 首頁">
      <span class="brand-sprite">{logo}</span>
      <span class="brand-name">{SITE['title']}</span>
    </a>
    <nav class="site-nav" aria-label="主選單">{nav_items}</nav>
    <button class="theme-toggle" type="button" aria-label="切換深淺色">
      <svg class="icon-moon" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M3 0h3v1H3zM2 1h2v1H2zM1 2h2v1H1zM1 3h2v1H1zM1 4h2v1H1zM1 5h3v1H1zM2 6h5v1H2zM3 7h3v1H3zM6 5h1v1H6z"/></svg>
      <svg class="icon-sun" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M3 0h2v1H3zM0 3h1v2H0zM7 3h1v2H7zM3 7h2v1H3zM1 1h1v1H1zM6 1h1v1H6zM1 6h1v1H1zM6 6h1v1H6zM3 2h2v1H3zM2 3h4v2H2zM3 5h2v1H3z"/></svg>
    </button>
  </div>
</header>
<main id="main">
{body}
</main>
<footer class="site-footer">
  <div class="container footer-inner">
    <p class="footer-title">© {date.today().year} {SITE['title']}</p>
    <p class="footer-links">
      <a href="/about/">關於</a><a href="/privacy/">隱私權政策</a><a href="/contact/">留言給我</a><a href="/feed.xml">RSS</a>
    </p>
    <p class="footer-note">像素字型：俐方體11號（Cubic 11, SIL OFL 1.1）</p>
  </div>
</footer>
<script src="/main.js?v={BUILD_ID}" defer></script>
</body>
</html>
"""


def tag_list(tags: list[str]) -> str:
    return "".join(f'<li class="tag">{esc(t)}</li>' for t in tags)


def post_card(p: Post, index: int) -> str:
    return f"""<article class="save-slot">
  <a class="save-slot-link" href="{p.url}">
    <div class="slot-head">
      <span class="slot-no">SLOT {index:02d}</span>
      <span class="slot-exp">EXP +{p.minutes * 10}</span>
    </div>
    <h3 class="slot-title">{esc(p.title)}</h3>
    <p class="slot-desc">{esc(p.description)}</p>
    <div class="slot-meta">
      <time datetime="{p.date.isoformat()}">{fmt_date(p.date)}</time>
      <span>約 {p.minutes} 分鐘</span>
    </div>
    <ul class="tags">{tag_list(p.tags)}</ul>
  </a>
</article>"""


def render_home(posts: list[Post], games: list) -> str:
    sprite = sprite_svg(GUAVA_SPRITE, SPRITE_COLORS, "像素芭樂")
    cards = "".join(post_card(p, i + 1) for i, p in enumerate(posts[:6]))
    body = f"""
<section class="hero">
  <div class="container hero-inner">
    <div class="hero-text">
      <p class="hero-kicker">PLAYER 1 · LV.{len(posts)}</p>
      <h1 class="hero-title">芭樂工程師的<br>技術存檔點</h1>
      <p class="hero-lead">記錄真的做過的 AI 應用、系統實作與開發筆記，<br class="br-wide">偶爾也做幾款像素小遊戲。</p>
      <div class="hero-actions">
        <a class="px-btn px-btn-primary" href="/posts/">開始閱讀</a>
        <a class="px-btn" href="/arcade/">進入遊戲廳</a>
      </div>
      <p class="press-start" aria-hidden="true">PRESS START</p>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="hero-sprite">{sprite}</div>
      <div class="hero-shadow"></div>
    </div>
  </div>
  <div class="container">
    <dl class="stat-bar">
      <div><dt>POSTS</dt><dd>{len(posts):02d}</dd></div>
      <div><dt>GAMES</dt><dd>{len(games):02d}</dd></div>
      <div><dt>COFFEE</dt><dd>99+</dd></div>
    </dl>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <h2 class="section-title"><span class="section-en">LATEST SAVES</span>最新文章</h2>
      <a class="section-more" href="/posts/">全部文章 ▶</a>
    </div>
    <div class="slot-grid">{cards}</div>
  </div>
</section>

<section class="section section-alt">
  <div class="container arcade-teaser">
    <div>
      <h2 class="section-title"><span class="section-en">ARCADE</span>像素遊戲廳</h2>
      <p>瀏覽器打開就能玩的小遊戲，每款都會附上開發筆記，從構想、程式到踩過的坑一次整理。</p>
      <a class="px-btn" href="/arcade/">INSERT COIN</a>
    </div>
    <div class="coin-slot" aria-hidden="true"><span>1 CREDIT</span></div>
  </div>
</section>
"""
    return layout(title=SITE["title"], description=SITE["description"], path="/", body=body, body_class="page-home")


def render_post_list(posts: list[Post]) -> str:
    cards = "".join(post_card(p, i + 1) for i, p in enumerate(posts))
    all_tags = sorted({t for p in posts for t in p.tags})
    body = f"""
<section class="page-head">
  <div class="container">
    <p class="page-kicker">LOAD GAME</p>
    <h1 class="page-title">所有文章</h1>
    <p class="page-lead">技術案例、AI 應用與開發筆記，選一個存檔點繼續冒險。</p>
    <ul class="tags tags-lg">{tag_list(all_tags)}</ul>
  </div>
</section>
<section class="section">
  <div class="container"><div class="slot-grid">{cards}</div></div>
</section>
"""
    return layout(title="所有文章", description="技術案例、AI 應用與開發筆記列表。", path="/posts/", body=body)


def render_post(p: Post, prev_post: Post | None, next_post: Post | None, draft: bool = False) -> str:
    updated = (
        f'<span>更新 <time datetime="{p.updated.isoformat()}">{fmt_date(p.updated)}</time></span>'
        if p.updated else ""
    )
    toc = ""
    if p.toc_html and "<li>" in p.toc_html:
        toc = f'<details class="toc" open><summary>MAP · 本文地圖</summary>{p.toc_html}</details>'
    nav_parts = []
    if next_post:
        nav_parts.append(f'<a class="post-nav-link" href="{next_post.url}"><span>◀ 較新</span>{esc(next_post.title)}</a>')
    if prev_post:
        nav_parts.append(f'<a class="post-nav-link is-next" href="{prev_post.url}"><span>較舊 ▶</span>{esc(prev_post.title)}</a>')
    ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": p.title,
        "description": p.description,
        "datePublished": p.date.isoformat(),
        "dateModified": (p.updated or p.date).isoformat(),
        "author": {"@type": "Person", "name": SITE["author"]},
        "mainEntityOfPage": SITE["url"] + p.url,
        "inLanguage": SITE["lang"],
    }
    head_extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
    body = f"""
<div class="xp-bar" aria-hidden="true"><div class="xp-fill"></div><span class="xp-label">EXP</span></div>
{draft_banner(p) if draft else ''}
<article class="post">
  <header class="post-head container narrow">
    <ul class="tags">{tag_list(p.tags)}</ul>
    <h1 class="post-title">{esc(p.title)}</h1>
    <p class="post-desc">{esc(p.description)}</p>
    <div class="post-meta">
      <span><time datetime="{p.date.isoformat()}">{fmt_date(p.date)}</time></span>
      {updated}
      <span>閱讀約 {p.minutes} 分鐘</span>
    </div>
  </header>
  <div class="container narrow">
    {toc}
    <div class="prose">
{p.body_html}
    </div>
    <div class="post-end">
      <p class="post-end-title">STAGE CLEAR!</p>
      <p>獲得 EXP +{p.minutes * 10}。有問題或想看的主題，歡迎<a href="/contact/" class="contact-link">私訊留言給我</a>。</p>
    </div>
    {"" if draft else comments_block()}
    <nav class="post-nav" aria-label="上一篇與下一篇">{"".join(nav_parts)}</nav>
  </div>
</article>
"""
    path = f"/drafts/{p.slug}/" if draft else p.url
    return layout(title=p.title, description=p.description, path=path, body=body,
                  og_type="article", head_extra=head_extra, body_class="page-post", noindex=draft)


def draft_banner(p: Post) -> str:
    if p.extra.get("scheduled"):
        when = p.extra["sort"].strftime("%Y.%m.%d %H:%M")
        return f'<div class="draft-banner">SCHEDULED・排程中：這篇文章將在 {when}（台灣時間）自動發布。</div>'
    return '<div class="draft-banner">DRAFT・草稿預覽：這篇文章尚未發布，不會出現在文章列表，也不會被搜尋引擎收錄。</div>'


def render_drafts(drafts: list[Post]) -> str:
    items = "".join(
        f'<li><a href="/drafts/{d.slug}/">{esc(d.title)}</a>'
        + (f'（排程中：{d.extra["sort"].strftime("%Y.%m.%d %H:%M")} 自動發布）</li>' if d.extra.get("scheduled")
           else f'（草稿，預計 {fmt_date(d.date)}）</li>')
        for d in drafts
    ) or "<li>目前沒有草稿。</li>"
    body = f"""
<section class="page-head">
  <div class="container narrow">
    <p class="page-kicker">DRAFTS</p>
    <h1 class="page-title">草稿預覽</h1>
    <p class="page-lead">尚未發布的文章，只有知道網址的人看得到，搜尋引擎不會收錄。</p>
  </div>
</section>
<section class="section section-tight">
  <div class="container narrow"><div class="prose"><ul>{items}</ul></div></div>
</section>
"""
    return layout(title="草稿預覽", description="尚未發布的文章。", path="/drafts/", body=body, noindex=True)


def cover_svg(name: str) -> str:
    rows, colors = COVERS.get(name, COVERS["guava"])
    return sprite_svg(rows, colors)


def render_arcade(games: list[Game]) -> str:
    cabinets = "".join(
        f"""<a class="cabinet" href="{g.url}">
  <div class="cabinet-screen"><div class="cabinet-sprite">{cover_svg(g.cover)}</div></div>
  <p class="cabinet-name">{esc(g.title)}</p>
  <p class="cabinet-en">{esc(g.title_en)}</p>
  <p class="cabinet-desc">{esc(g.description)}</p>
  <p class="cabinet-status is-ready">PLAY ▶</p>
</a>"""
        for g in games
    )
    cabinets += """<div class="cabinet is-locked">
  <div class="cabinet-screen"><span class="cabinet-q">?</span></div>
  <p class="cabinet-name">NEXT GAME</p>
  <p class="cabinet-status">COMING SOON</p>
</div>"""
    body = f"""
<section class="page-head">
  <div class="container">
    <p class="page-kicker">ARCADE</p>
    <h1 class="page-title">像素遊戲廳</h1>
    <p class="page-lead">打開瀏覽器就能玩的小遊戲，手機、電腦都可以玩。每一台機台都附上玩法說明和開發筆記。</p>
  </div>
</section>
<section class="section">
  <div class="container"><div class="cabinet-grid">{cabinets}</div></div>
</section>
"""
    return layout(title="像素遊戲廳", description="瀏覽器即可遊玩的像素小遊戲與開發筆記。", path="/arcade/", body=body)


def render_game(g: Game, others: list[Game]) -> str:
    controls = "".join(f"<li>{esc(c)}</li>" for c in g.controls)
    more = "".join(
        f'<a class="post-nav-link" href="{o.url}"><span>也玩玩看 ▶</span>{esc(o.title)}</a>' for o in others
    )
    ld = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": g.title,
        "description": g.description,
        "url": SITE["url"] + g.url,
        "genre": "Arcade",
        "gamePlatform": "Web browser",
        "inLanguage": SITE["lang"],
    }
    head_extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
    body = f"""
<section class="page-head game-head">
  <div class="container narrow">
    <p class="page-kicker"><a href="/arcade/">ARCADE</a> ▶ {esc(g.title_en)}</p>
    <h1 class="page-title">{esc(g.title)}</h1>
    <p class="page-lead">{esc(g.description)}</p>
  </div>
</section>
<section class="section section-tight">
  <div class="container narrow">
    <div class="game-frame{' is-portrait' if g.portrait else ''}">
      <canvas id="game" class="game-canvas{' is-portrait' if g.portrait else ''}" aria-label="{esc(g.title)} 遊戲畫面"></canvas>
    </div>
    <div class="game-bar">
      <ul class="game-controls">{controls}</ul>
      <button class="px-btn game-mute" type="button" data-px-mute>SOUND ON</button>
    </div>
    <div class="prose game-notes">
{g.body_html}
    </div>
    <nav class="post-nav" aria-label="其他遊戲">{more}</nav>
  </div>
</section>
<script src="/games/px.js?v={BUILD_ID}"></script>
<script src="/games/{g.script}?v={BUILD_ID}"></script>
"""
    return layout(title=g.title, description=g.description, path=g.url, body=body,
                  head_extra=head_extra, body_class="page-game")


def contact_form(intro: str = "") -> str:
    endpoint = SITE.get("contact_endpoint", "")
    if not endpoint:
        return ""
    intro_html = f'<p class="contact-intro">{intro}</p>' if intro else ""
    site_key = SITE.get("turnstile_site_key", "")
    captcha = (
        f'<div class="cf-turnstile" data-sitekey="{esc(site_key)}" data-language="zh-tw" data-theme="auto"></div>'
        '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
        if site_key else ""
    )
    return f"""
<section class="contact-box" id="contact">
  <p class="contact-kicker">SEND MESSAGE・私訊站長</p>
  {intro_html}
  <form class="contact-form" data-endpoint="{esc(endpoint)}" novalidate>
    <div class="contact-row">
      <label><span class="label-text">暱稱<span class="req">*</span></span>
        <input name="name" type="text" maxlength="50" required autocomplete="nickname">
      </label>
      <label><span class="label-text">Email<span class="opt">（選填，想收到回覆再填）</span></span>
        <input name="email" type="email" maxlength="254" autocomplete="email">
      </label>
    </div>
    <label><span class="label-text">想說的話<span class="req">*</span></span>
      <textarea name="message" rows="6" maxlength="2000" required></textarea>
      <span class="contact-count" aria-live="polite">0 / 2000</span>
    </label>
    <label class="contact-hp" aria-hidden="true">網站<input name="website" type="text" tabindex="-1" autocomplete="off"></label>
    {captcha}
    <div class="contact-actions">
      <button class="px-btn px-btn-primary" type="submit">送出 ▶</button>
      <p class="contact-status" role="status"></p>
    </div>
    <p class="contact-note">留言只有站長看得到，會用於回覆你的訊息，詳見<a href="/privacy/">隱私權政策</a>。</p>
  </form>
</section>"""


def comments_block() -> str:
    gc = SITE.get("giscus") or {}
    if not gc.get("category_id"):
        return ""
    attrs = " ".join(
        f'data-{k}="{esc(str(v))}"'
        for k, v in {
            "repo": gc["repo"], "repo-id": gc["repo_id"],
            "category": gc["category"], "category-id": gc["category_id"],
        }.items()
    )
    return f"""
<section class="comments" aria-label="留言區">
  <p class="comments-title">COMMENTS・留言區</p>
  <p class="comments-note">公開留言需要登入 GitHub 帳號。不想公開，也可以<a href="/contact/" class="contact-link">私訊給我</a>。</p>
  <div class="giscus-mount" {attrs}></div>
</section>"""


def render_simple_page(path: str, kicker: str, title: str, description: str, md_text: str,
                       with_form: bool = False, form_intro: str = "") -> str:
    content = enhance_html(make_md().convert(md_text))
    if with_form:
        content += contact_form(form_intro)
    body = f"""
<section class="page-head">
  <div class="container narrow">
    <p class="page-kicker">{kicker}</p>
    <h1 class="page-title">{esc(title)}</h1>
  </div>
</section>
<section class="section section-tight">
  <div class="container narrow"><div class="prose">{content}</div></div>
</section>
"""
    return layout(title=title, description=description, path=path, body=body)


def render_404() -> str:
    body = """
<section class="game-over">
  <div class="container">
    <p class="go-title">GAME OVER</p>
    <p class="go-sub">找不到這個頁面（404），可能已經搬家或從來沒存在過。</p>
    <p class="go-continue">CONTINUE?</p>
    <div class="hero-actions center">
      <a class="px-btn px-btn-primary" href="/">YES・回首頁</a>
      <a class="px-btn" href="/posts/">看文章</a>
    </div>
  </div>
</section>
"""
    return layout(title="找不到頁面", description="找不到這個頁面。", path="/404.html", body=body)


# ─────────────────────────── 訂閱與網站地圖 ───────────────────────────

def render_feed(posts: list[Post]) -> str:
    items = "".join(
        f"""<item><title>{esc(p.title)}</title><link>{SITE['url']}{p.url}</link>
<guid>{SITE['url']}{p.url}</guid><pubDate>{datetime.combine(p.date, datetime.min.time(), timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000')}</pubDate>
<description>{esc(p.description)}</description></item>"""
        for p in posts
    )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>{SITE['title']}</title><link>{SITE['url']}/</link>
<description>{esc(SITE['description'])}</description><language>zh-TW</language>
{items}
</channel></rss>
"""


def render_sitemap(posts: list[Post], pages: list[str]) -> str:
    urls = [f"<url><loc>{SITE['url']}{p}</loc></url>" for p in pages]
    urls += [
        f"<url><loc>{SITE['url']}{p.url}</loc><lastmod>{(p.updated or p.date).isoformat()}</lastmod></url>"
        for p in posts
    ]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + "".join(urls) + "</urlset>\n")


# ─────────────────────────── 主程式 ───────────────────────────

def write(rel: str, text: str) -> None:
    out = DIST / rel.lstrip("/")
    if rel.endswith("/"):
        out = out / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")


def build() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(STATIC, DIST)
    for f in SRC.iterdir():
        shutil.copy(f, DIST / f.name)
    (DIST / "favicon.svg").write_text(sprite_svg(GUAVA_SPRITE, SPRITE_COLORS), encoding="utf-8")

    posts = load_posts()
    games = load_games()
    write("/", render_home(posts, games))
    write("/posts/", render_post_list(posts))
    for i, p in enumerate(posts):
        prev_post = posts[i + 1] if i + 1 < len(posts) else None
        next_post = posts[i - 1] if i > 0 else None
        write(p.url, render_post(p, prev_post, next_post))
    drafts = load_posts(drafts=True)
    write("/drafts/", render_drafts(drafts))
    for d in drafts:
        html_out = render_post(d, None, None, draft=True)
        # 草稿之間互相連結時，預覽版改連到草稿網址
        for other in drafts:
            html_out = html_out.replace(f'href="{other.url}"', f'href="/drafts/{other.slug}/"')
        write(f"/drafts/{d.slug}/", html_out)
    write("/arcade/", render_arcade(games))
    for g in games:
        write(g.url, render_game(g, [o for o in games if o.slug != g.slug]))

    pages_dir = CONTENT / "pages"
    simple_pages = []
    for path in sorted(pages_dir.glob("*.md")):
        meta, text = parse_front_matter(path.read_text(encoding="utf-8"))
        url = f"/{path.stem}/"
        write(url, render_simple_page(url, meta.get("kicker", ""), meta["title"], meta.get("description", ""), text,
                                      with_form=str(meta.get("contact_form", "")).lower() == "true",
                                      form_intro=meta.get("form_intro", "")))
        simple_pages.append(url)

    write("/404.html", render_404())
    write("/feed.xml", render_feed(posts))
    write("/sitemap.xml", render_sitemap(posts, ["/", "/posts/", "/arcade/", *[g.url for g in games], *simple_pages]))
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE['url']}/sitemap.xml\n", encoding="utf-8")
    if SITE.get("adsense_client"):
        pub = SITE["adsense_client"].replace("ca-", "")
        (DIST / "ads.txt").write_text(f"google.com, {pub}, DIRECT, f08c47fec0942fa0\n", encoding="utf-8")
    print(f"Built {len(posts)} post(s), {len(drafts)} draft(s), {len(games)} game(s) → {DIST}")


if __name__ == "__main__":
    build()
    if "--serve" in sys.argv:
        import functools
        import http.server

        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
        print("Serving on http://localhost:8000")
        http.server.ThreadingHTTPServer(("", 8000), handler).serve_forever()
