/* 芭樂園抓蟲 Guava Sweeper */
(() => {
  const { C } = PX;
  const W = 160, H = 290;
  const TOOL_Y = 258;               // 最下面的工具列：挖開／插旗
  const HUD_H = 12;
  const BAR_Y = 13, BAR_H = 16;     // 狀態列：剩幾隻蟲、時間、挖／插旗切換
  const TOP = 31;                   // 田地的上緣
  let CELL = 16;                    // 格子大小：特難和地獄是 12
  const LEVELS = [
    { key: "easy", name: "簡單", cols: 8, rows: 10, bugs: 10 },
    { key: "normal", name: "普通", cols: 10, rows: 13, bugs: 20 },
    { key: "hard", name: "困難", cols: 10, rows: 14, bugs: 28 },
    { key: "expert", name: "特難", cols: 13, rows: 18, bugs: 48, cell: 12 },
    { key: "hell", name: "地獄", cols: 13, rows: 18, bugs: 60, cell: 12 },
  ];
  const LONG_PRESS = 0.35;

  // ── 像素圖（16×16） ──
  const leaf = PX.sprite([
    "KKKKKKKKKKKKKKKK",
    "KLLLLLLLLLLLLLLD",
    "KLGGGGGGGGGGGGLD",
    "KLGGGGGGGGDGGGLD",
    "KLGGGDGGGGGGGGLD",
    "KLGGGGGGGGGGGGLD",
    "KLGGGGGGGGGGDGLD",
    "KLGGGGGGDGGGGGLD",
    "KLGGDGGGGGGGGGLD",
    "KLGGGGGGGGGGGGLD",
    "KLGGGGGGGGDGGGLD",
    "KLGGGGDGGGGGGGLD",
    "KLGGGGGGGGGGGGLD",
    "KLGGGGGGGGGGGGLD",
    "KDDDDDDDDDDDDDDD",
    "KKKKKKKKKKKKKKKK",
  ], { K: C.ink, L: "#7be08a", G: "#3aa858", D: "#1f6e3a" });
  const leafHot = PX.sprite(Array.from({ length: 16 }, (_, j) =>
    j === 0 || j === 15 ? "KKKKKKKKKKKKKKKK" : "K" + "L".repeat(14) + "K"), { K: C.ink, L: "#a8f0b0" });
  const dirt = PX.sprite(Array.from({ length: 16 }, (_, j) =>
    j === 15 ? "DDDDDDDDDDDDDDDD" : "D" + Array.from({ length: 15 }, (_, i) => ((i * 7 + j * 5) % 23 === 0 ? "S" : "B")).join("")),
  { D: "#a8783e", B: "#e8c890", S: "#d4ac70" });
  const flag = PX.sprite([
    "................",
    "................",
    "......KK........",
    "......KRRRR.....",
    "......KRRRRRR...",
    "......KRRRRRRR..",
    "......KRRRRRR...",
    "......KRRRR.....",
    "......K.........",
    "......K.........",
    "......K.........",
    "....KKKKK.......",
    "...KLLLLLK......",
    "...KLPPPLK......",
    "....KKKKK.......",
    "................",
  ], { K: C.ink, R: C.red, L: C.lime, P: C.pink });
  const bug = PX.sprite([
    "................",
    "....K......K....",
    ".....K....K.....",
    "......KKKK......",
    "....KKRRRRKK....",
    "...KRRWKRWKRK...",
    "..KRRRRRRRRRRK..",
    ".KKRRKRRRRKRRKK.",
    "..KRRRRKKRRRRK..",
    ".KKRRKRRRRKRRKK.",
    "..KRRRRRRRRRRK..",
    "...KRRRRRRRRK...",
    "..K.KKKKKKKK.K..",
    ".K..K......K..K.",
    "................",
    "................",
  ], { K: C.ink, R: C.red, W: C.white });
  const flagIcon = PX.sprite([
    ".KK.......",
    ".KRRRR....",
    ".KRRRRRR..",
    ".KRRRRRRR.",
    ".KRRRR....",
    ".K........",
    ".K........",
    "KKKK......",
  ], { K: C.ink, R: C.white });
  const dirtIcon = PX.sprite([
    "....KK....",
    "....KK....",
    "....KK....",
    "...KWWK...",
    "..KWWWWK..",
    "..KWWWWK..",
    "...KWWK...",
    "....KK....",
  ], { K: C.ink, W: C.light });
  // 依格子大小產生葉子和土的圖（16 用手畫的，其他大小用程式產生）
  const tileCache = {};
  function tileSet(n) {
    if (tileCache[n]) return tileCache[n];
    if (n === 16) return (tileCache[n] = { leaf, hot: leafHot, dirt });
    const rows = (fn) => Array.from({ length: n }, (_, j) => Array.from({ length: n }, (_, i) => fn(i, j)).join(""));
    const lf = PX.sprite(rows((i, j) => (j === 0 || i === 0 ? "K" : j === n - 1 || i === n - 1 ? "D" : j === 1 || i === 1 ? "L"
      : (i * 5 + j * 3) % 11 === 0 ? "D" : "G")), { K: C.ink, L: "#7be08a", G: "#3aa858", D: "#1f6e3a" });
    const ht = PX.sprite(rows((i, j) => (j === 0 || i === 0 || j === n - 1 || i === n - 1 ? "K" : "L")), { K: C.ink, L: "#a8f0b0" });
    const dt = PX.sprite(rows((i, j) => (j === n - 1 || i === 0 ? "D" : (i * 7 + j * 5) % 23 === 0 ? "S" : "B")),
      { D: "#a8783e", B: "#e8c890", S: "#d4ac70" });
    return (tileCache[n] = { leaf: lf, hot: ht, dirt: dt });
  }
  const NUM_COLORS = ["", "#1d6fd0", "#1f8a3a", "#d0303a", "#5a2a9a", "#9a3a10", "#178a8a", C.ink, C.gray];

  // ── 狀態 ──
  let state = "title";  // title / play / win / lose
  let t = 0, stateT = 0;
  let lv = 0, L = LEVELS[0];
  let grid = [], ox = 0;
  let first = true, flags = 0, revealed = 0, time = 0;
  let mode = "dig";   // dig 挖開 / flag 插旗 / q 問號
  let press = null, wasDown = false;
  let boomCell = null, best = 0, newRecord = false;
  let revived = false, reward = null, reviveMsg = "";
  let cursor = { x: 0, y: 0 }, useCursor = false;

  const diffBtn = (i) => ({ x: 20, y: 116 + i * 28, w: 120, h: 26 });
  const TOOLS = [
    { mode: "dig", label: "挖開", x: 4, col: "#a8783e" },
    { mode: "flag", label: "插旗", x: 56, col: C.red },
    { mode: "q", label: "問號", x: 108, col: "#c08a00" },
  ].map((b) => ({ ...b, y: TOOL_Y + 3, w: 48, h: 26 }));
  const RESTART_BTN = { x: 64, y: BAR_Y + 1, w: 32, h: BAR_H - 2 };
  const END_AGAIN = { x: 22, y: 150, w: 56, h: 18 }, END_MENU = { x: 82, y: 150, w: 56, h: 18 };
  const REVIVE_BTN = { x: 22, y: 140, w: 116, h: 20 }, GIVEUP_BTN = { x: 50, y: 166, w: 60, h: 16 };
  const inRect = (p, r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;

  function start(i) {
    lv = i; L = LEVELS[i]; CELL = L.cell || 16;
    ox = Math.floor((W - L.cols * CELL) / 2);
    grid = [];
    for (let y = 0; y < L.rows; y++) for (let x = 0; x < L.cols; x++) grid.push({ x, y, bug: false, n: 0, open: false, flag: false, q: false });
    first = true; flags = 0; revealed = 0; time = 0; mode = "dig"; boomCell = null; newRecord = false; revived = false; reward = null; reviveMsg = "";
    cursor = { x: L.cols >> 1, y: L.rows >> 1 };
    best = PX.best(`guava-sweeper-${L.key}`);
    state = "play"; stateT = 0;
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= L.cols || y >= L.rows ? null : grid[y * L.cols + x]);
  const around = (c) => {
    const r = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) { const n = at(c.x + dx, c.y + dy); if (n) r.push(n); }
    return r;
  };

  // 第一次點開才放蟲，而且點的那格和周圍 8 格一定安全
  function plant(safe) {
    const banned = new Set([safe, ...around(safe)]);
    const pool = grid.filter((c) => !banned.has(c));
    for (let k = 0; k < L.bugs && pool.length; k++) {
      const i = (Math.random() * pool.length) | 0;
      pool[i].bug = true; pool.splice(i, 1);
    }
    for (const c of grid) c.n = around(c).filter((n) => n.bug).length;
  }

  function open(c) {
    if (c.open || c.flag) return;
    if (first) { plant(c); first = false; }
    if (c.bug) { lose(c); return; }
    // 用堆疊展開空白區域
    const stack = [c];
    let count = 0;
    while (stack.length) {
      const k = stack.pop();
      if (k.open || k.flag) continue;
      k.open = true; k.q = false; revealed++; count++;
      if (k.n === 0) for (const n of around(k)) if (!n.open && !n.bug) stack.push(n);
    }
    PX.beep(count > 1 ? 520 : 440, 0.04, "square", 0.04);
    if (revealed === L.cols * L.rows - L.bugs) win();
  }

  // 點已翻開的數字：旗子數量對了，就一次翻開周圍
  function chord(c) {
    const ns = around(c);
    if (ns.filter((n) => n.flag).length !== c.n) { PX.beep(200, 0.05, "triangle", 0.04); return; }
    for (const n of ns) if (!n.open && !n.flag) { open(n); if (state !== "play") return; }
  }

  function toggleFlag(c) {
    if (c.open) return;
    // 依序切換：沒標記 → 旗子（確定是蟲）→ 問號（可能是蟲）→ 沒標記
    if (c.flag) { c.flag = false; c.q = true; flags--; }
    else if (c.q) c.q = false;
    else { c.flag = true; flags++; }
    PX.beep(c.flag ? 700 : c.q ? 560 : 350, 0.05, "square", 0.04);
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) {}
  }

  // 插旗模式／問號模式：點一下放上去，再點一下拿掉
  function setMark(c, kind) {
    if (c.open) return;
    if (kind === "flag") {
      if (c.flag) { c.flag = false; flags--; } else { c.flag = true; c.q = false; flags++; }
    } else {
      if (c.q) c.q = false; else { if (c.flag) { c.flag = false; flags--; } c.q = true; }
    }
    PX.beep(c.flag ? 700 : c.q ? 560 : 350, 0.05, "square", 0.04);
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) {}
  }

  function primary(c) {
    if (c.open) chord(c);
    else if (mode === "flag" || mode === "q") setMark(c, mode);
    else open(c);
  }

  // 挖到蟲：每局有一次機會「敗部復活」（看廣告；沒有廣告時免費）
  function lose(c) {
    boomCell = c; c.open = true; stateT = 0;
    PX.beep(160, 0.3, "sawtooth", 0.08, -100);
    if (!revived) { state = "dead"; reward = PX.requestReward("guava-sweeper-revive"); reviveMsg = ""; }
    else finalLose();
  }
  function finalLose() {
    state = "lose"; stateT = 0;
    for (const k of grid) if (k.bug) k.open = true;
  }
  function revive() {
    const c = boomCell;
    c.open = false; c.flag = true; c.q = false; flags++;
    boomCell = null; revived = true; reward = null;
    state = "play"; stateT = 0;
    PX.beep(523, 0.08); setTimeout(() => PX.beep(784, 0.12), 80);
  }
  function win() {
    state = "win"; stateT = 0;
    for (const k of grid) if (k.bug && !k.flag) { k.flag = true; flags++; }
    const sec = Math.floor(time);
    if (!revived && (!best || sec < best)) { best = sec; PX.best(`guava-sweeper-${L.key}`, sec); newRecord = true; }
    PX.beep(523, 0.1); setTimeout(() => PX.beep(659, 0.1), 100); setTimeout(() => PX.beep(784, 0.2), 200);
  }

  const cellAt = (p) => {
    const x = Math.floor((p.x - ox) / CELL), y = Math.floor((p.y - TOP) / CELL);
    return at(x, y);
  };

  // 電腦右鍵插旗
  let rightClick = false;
  const canvas = document.getElementById("game");
  if (canvas) {
    canvas.addEventListener("pointerdown", (e) => { rightClick = e.button === 2; }, true);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  const game = {
    width: W, height: H,
    update(dt, api) {
      t += dt; stateT += dt;
      const p = api.input.pointer;
      const tap = api.tapped();
      const released = wasDown && !p.down;
      wasDown = p.down;

      if (state === "title") {
        if (tap) LEVELS.forEach((_, i) => { if (inRect(p, diffBtn(i))) { start(i); PX.beep(523, 0.08); } });
        if (api.hit(" ", "Enter")) start(0);
        return;
      }
      if (state === "dead") {
        if (reward && reward.result === "viewed") { revive(); return; }
        if (reward && reward.result === "dismissed") { reward = null; reviveMsg = "要看完廣告才能復活喔"; }
        if (stateT > 0.5 && tap) {
          if (inRect(p, GIVEUP_BTN)) finalLose();
          else if (reward && inRect(p, REVIVE_BTN)) {
            if (reward.status === "ready") reward.show();
            else if (reward.status === "none") revive();
          }
        }
        return;
      }
      if (state === "win" || state === "lose") {
        if (stateT > 0.6) {
          if (tap && inRect(p, END_AGAIN)) start(lv);
          else if (tap && inRect(p, END_MENU)) { state = "title"; stateT = 0; }
          else if (api.hit(" ", "Enter")) start(lv);
        }
        return;
      }

      if (!first) time += dt;

      // 狀態列按鈕
      if (tap) {
        const b = TOOLS.find((b) => inRect(p, b));
        if (b) { if (mode !== b.mode) { mode = b.mode; PX.beep(b.mode === "dig" ? 500 : 700, 0.05); } return; }
      }
      if (tap && inRect(p, RESTART_BTN)) { start(lv); return; }

      // 點田地：放開才動作；按住不放就插旗
      if (tap) {
        const c = cellAt(p);
        press = c ? { c, t: 0, done: false, x: p.x, y: p.y, right: rightClick } : null;
        if (press && press.right) { toggleFlag(c); press.done = true; }
        // 很快的點擊：按下和放開落在同一幀，這裡就直接當成放開
        else if (press && !p.down) { primary(c); press = null; }
        useCursor = false;
      }
      if (press && p.down && !press.done) {
        press.t += dt;
        if (Math.hypot(p.x - press.x, p.y - press.y) > 8) press.done = true; // 手指滑開就取消
        else if (press.t > LONG_PRESS && !press.c.open) { toggleFlag(press.c); press.done = true; }
      }
      if (press && released) {
        if (!press.done) primary(press.c);
        press = null;
      }

      // 鍵盤：方向鍵移動游標，空白鍵翻開，F 插旗
      const mv = [["ArrowLeft", -1, 0], ["ArrowRight", 1, 0], ["ArrowUp", 0, -1], ["ArrowDown", 0, 1]];
      for (const [k, dx, dy] of mv) if (api.hit(k)) {
        cursor.x = Math.max(0, Math.min(L.cols - 1, cursor.x + dx));
        cursor.y = Math.max(0, Math.min(L.rows - 1, cursor.y + dy));
        useCursor = true;
      }
      if (api.hit(" ", "Enter")) { useCursor = true; primary(at(cursor.x, cursor.y)); }
      if (api.hit("f")) { useCursor = true; toggleFlag(at(cursor.x, cursor.y)); }
    },
    draw(g) {
      g.clear("#1d2b53");
      if (state === "title") { drawTitle(g); return; }

      // 田地
      g.rect(ox - 2, TOP - 2, L.cols * CELL + 4, L.rows * CELL + 4, C.ink);
      for (const c of grid) {
        const x = ox + c.x * CELL, y = TOP + c.y * CELL;
        const tiles = tileSet(CELL), ty = y + Math.floor((CELL - 13) / 2), ctx = g.ctx;
        if (c.open) {
          g.draw(tiles.dirt, x, y);
          if (c.bug) {
            if (c === boomCell) g.rect(x, y, CELL, CELL, C.red);
            ctx.drawImage(bug, x, y, CELL, CELL);
          } else if (c.n) g.text(String(c.n), x + CELL / 2, ty, NUM_COLORS[c.n], { align: "center" });
        } else {
          const hot = press && press.c === c && !press.done;
          g.draw(hot ? tiles.hot : tiles.leaf, x, y);
          if (c.flag) {
            ctx.drawImage(flag, x, y, CELL, CELL);
            if (state === "lose" && !c.bug) { g.rect(x + 2, y + CELL / 2 - 1, CELL - 4, 2, C.red); }
          } else if (c.q) {
            g.text("?", x + CELL / 2, ty, C.yellow, { align: "center", shadow: C.ink });
          }
        }
      }
      // 長按進度
      if (press && !press.done && press.t > 0.08 && !press.c.open) {
        const k = Math.min(1, press.t / LONG_PRESS);
        g.rect(ox + press.c.x * CELL + 1, TOP + press.c.y * CELL + CELL - 3, Math.round((CELL - 2) * k), 2, C.red);
      }
      if (useCursor && state === "play") {
        const x = ox + cursor.x * CELL, y = TOP + cursor.y * CELL;
        const blink = Math.floor(t * 4) % 2 ? C.yellow : C.white;
        g.rect(x, y, CELL, 1, blink); g.rect(x, y + CELL - 1, CELL, 1, blink);
        g.rect(x, y, 1, CELL, blink); g.rect(x + CELL - 1, y, 1, CELL, blink);
      }

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.95)");
      g.text(`抓蟲・${L.name}`, 2, -1, C.yellow);
      g.text(`${Math.min(999, Math.floor(time))} 秒`, W - 2, -1, C.white, { align: "right" });
      // 狀態列
      g.rect(2, BAR_Y + 1, 52, BAR_H - 2, C.ink);
      g.draw(bug, 2, BAR_Y, false, 1);
      g.text(String(L.bugs - flags), 34, BAR_Y + 1, C.red, { align: "center" });
      g.rect(RESTART_BTN.x, RESTART_BTN.y, RESTART_BTN.w, RESTART_BTN.h, C.ink);
      g.text(state === "lose" || state === "dead" ? "QQ" : state === "win" ? "^^" : "↺", W / 2, BAR_Y + 1, C.yellow, { align: "center" });
      g.text(best ? `最快 ${best}s` : "", W - 3, BAR_Y + 1, C.light, { align: "right" });
      // 工具列：選「插旗」後，點哪一格就在哪一格插旗（不會挖開）
      g.rect(0, TOOL_Y, W, H - TOOL_Y, C.ink);
      const tool = (r, on, label, icon, col) => {
        g.rect(r.x, r.y, r.w, r.h, on ? C.white : C.gray);
        g.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4, on ? col : "#2c3d70");
        if (icon) g.draw(icon, r.x + 3, r.y + 9);
        else g.text("?", r.x + 8, r.y + 6, C.yellow, { align: "center", shadow: C.ink });
        g.text(label, r.x + 31, r.y + 6, on ? C.white : C.light, { align: "center", shadow: on ? C.ink : undefined });
      };
      for (const b of TOOLS) tool(b, mode === b.mode, b.label, { dig: dirtIcon, flag: flagIcon, q: null }[b.mode], b.col);

      // 結束畫面
      const panel = (y, h) => { g.rect(10, y, W - 20, h, C.white); g.rect(12, y + 2, W - 24, h - 4, C.navy); };
      const button = (r, label, col) => {
        g.rect(r.x, r.y, r.w, r.h, C.ink); g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, col);
        g.text(label, r.x + r.w / 2, r.y + 2, C.ink, { align: "center" });
      };
      if ((state === "win" || state === "lose") && stateT > 0.6) {
        panel(96, 80);
        if (state === "win") {
          g.text("抓完了！", W / 2, 104, C.yellow, { align: "center", size: 16, shadow: C.ink });
          g.text(`${L.name}・${Math.floor(time)} 秒`, W / 2, 124, C.white, { align: "center" });
          if (revived) g.text("復活過，不列入紀錄", W / 2, 136, C.light, { align: "center" });
          else g.text(newRecord ? "NEW RECORD!" : `BEST ${best} 秒`, W / 2, 136, newRecord ? C.yellow : C.light, { align: "center" });
        } else {
          g.text("被蟲咬了！", W / 2, 104, C.red, { align: "center", size: 16, shadow: C.ink });
          g.text(`翻開了 ${revealed} 格`, W / 2, 126, C.white, { align: "center" });
        }
        button(END_AGAIN, "再一局", C.yellow);
        button(END_MENU, "選難度", C.light);
      }
      if (state === "dead" && stateT > 0.5) {
        panel(92, 96);
        g.text("被蟲咬了！", W / 2, 100, C.red, { align: "center", size: 16, shadow: C.ink });
        g.text(reviveMsg || "復活後這隻蟲會插旗", W / 2, 120, reviveMsg ? C.yellow : C.white, { align: "center" });
        if (reward) {
          const st = reward.status;
          const label = st === "ready" ? "▶ 看廣告復活" : st === "none" ? "免費復活一次" : st === "showing" ? "廣告播放中…" : "準備中…";
          button(REVIVE_BTN, label, st === "ready" || st === "none" ? C.lime : C.light);
        }
        g.rect(GIVEUP_BTN.x, GIVEUP_BTN.y, GIVEUP_BTN.w, GIVEUP_BTN.h, C.gray);
        g.text("放棄", GIVEUP_BTN.x + GIVEUP_BTN.w / 2, GIVEUP_BTN.y + 1, C.white, { align: "center" });
      }
    },
  };

  function drawTitle(g) {
    // 背景：一小片田地
    for (let x = 0; x < 10; x++) {
      const k = (x * 3) % 7;
      g.draw(k < 3 ? leaf : dirt, x * 16, H - 18);
      if (k >= 3 && k % 2) g.text(String(1 + (k % 3)), x * 16 + 8, H - 17, NUM_COLORS[1 + (k % 3)], { align: "center" });
    }
    g.draw(flag, 32, H - 18); g.draw(bug, 112, H - 18);
    g.text("芭樂園", W / 2, 14, C.lime, { align: "center", size: 24, shadow: C.ink });
    g.text("抓蟲", W / 2, 40, C.pink, { align: "center", size: 24, shadow: C.ink });
    g.text("GUAVA SWEEPER", W / 2, 68, C.white, { align: "center", shadow: C.ink });
    g.text("數字＝周圍 8 格有幾隻蟲", W / 2, 86, C.white, { align: "center" });
    g.text("按住或右鍵：插旗 → 問號", W / 2, 99, C.yellow, { align: "center" });
    LEVELS.forEach((d, i) => {
      const r = diffBtn(i);
      g.rect(r.x, r.y, r.w, r.h, C.ink);
      g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, [C.lime, C.yellow, C.orange, C.red, C.plum][i]);
      const b = PX.best(`guava-sweeper-${d.key}`);
      const dark = i >= 3;
      g.text(`${d.name} ${d.cols}×${d.rows}・${d.bugs} 隻`, r.x + r.w / 2, r.y + 1, dark ? C.white : C.ink, { align: "center" });
      g.text(b ? `最快 ${b} 秒` : "還沒破關", r.x + r.w / 2, r.y + 13, dark ? C.peach : C.navy, { align: "center" });
    });
  }

  if (canvas) PX.run(canvas, game);
})();
