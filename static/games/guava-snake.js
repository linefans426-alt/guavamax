/* 毛毛蟲吃芭樂 Guava Snake */
(() => {
  const { C } = PX;
  const W = 160, H = 256;
  const HUD_H = 12;
  const CELL = 8, COLS = 20, ROWS = 22;
  const BX = 0, BY = 14;                 // 棋盤左上角
  const BOARD_B = BY + ROWS * CELL;      // 棋盤下緣（190）

  // 方向鍵按鈕（手機用）
  const PAD = {
    up: { x: 64, y: 196, w: 32, h: 28, d: [0, -1] },
    left: { x: 26, y: 226, w: 34, h: 28, d: [-1, 0] },
    down: { x: 64, y: 226, w: 32, h: 28, d: [0, 1] },
    right: { x: 100, y: 226, w: 34, h: 28, d: [1, 0] },
  };
  const MODES = [
    { key: "wall", name: "經典模式", desc: "撞牆結束" },
    { key: "wrap", name: "穿牆模式", desc: "可以穿牆" },
  ];
  const OVER_AGAIN = { x: 20, y: 134, w: 58, h: 18 }, OVER_MENU = { x: 82, y: 134, w: 58, h: 18 };
  const modeBtn = (i) => ({ x: 20, y: 136 + i * 34, w: 120, h: 28 });

  // ── 像素圖 ──
  const guava = PX.sprite([
    "...GG...",
    "..GG....",
    ".KKKKKK.",
    "KLLLLLLK",
    "KLPPPPLK",
    "KLPPPPLK",
    "KLLLLLLK",
    ".KKKKKK.",
  ], { K: C.ink, L: C.lime, P: C.pink, G: C.green });
  const golden = PX.sprite([
    "...GG...",
    "..GG....",
    ".KKKKKK.",
    "KYYYYYYK",
    "KYOOOOYK",
    "KYOWOOYK",
    "KYYYYYYK",
    ".KKKKKK.",
  ], { K: C.ink, Y: C.yellow, O: C.orange, W: C.white, G: C.green });
  // 頭（朝右），其他方向用旋轉畫
  const head = PX.sprite([
    ".KKKKK..",
    "KGGGGGK.",
    "KGGWKGGK",
    "KGGKKGGK",
    "KGGGGGRK",
    "KGGWKGGK",
    "KGGKKGGK",
    ".KKKKKK.",
  ], { K: C.ink, G: C.lime, W: C.white, R: C.pink });
  const body = PX.sprite([
    "........",
    ".KKKKKK.",
    "KGGGGGGK",
    "KGDGGDGK",
    "KGGGGGGK",
    "KGDGGDGK",
    ".KKKKKK.",
    "........",
  ], { K: C.ink, G: C.lime, D: C.green });
  const body2 = PX.sprite([
    "........",
    ".KKKKKK.",
    "KDDDDDDK",
    "KDGDDGDK",
    "KDDDDDDK",
    "KDGDDGDK",
    ".KKKKKK.",
    "........",
  ], { K: C.ink, G: C.lime, D: C.green });
  const tail = PX.sprite([
    "........",
    "........",
    "..KKKK..",
    ".KGGGGK.",
    ".KGGGGK.",
    "..KKKK..",
    "........",
    "........",
  ], { K: C.ink, G: C.green });

  // ── 狀態 ──
  let state = "title";   // title / play / over
  let t = 0, stateT = 0;
  let mode = 0;
  let snake = [], dir = [1, 0], queue = [], grow = 0;
  let food = null, gold = null, eaten = 0;
  let score = 0, best = 0, newRecord = false;
  let stepT = 0, speed = 0.16;
  let swipe = null, wasDown = false;
  let pops = [], flash = 0;

  const bestKey = () => `guava-snake-${MODES[mode].key}`;
  const occupied = (x, y) => snake.some((s) => s.x === x && s.y === y);
  function freeCell() {
    for (let k = 0; k < 500; k++) {
      const x = (Math.random() * COLS) | 0, y = (Math.random() * ROWS) | 0;
      if (!occupied(x, y) && !(food && food.x === x && food.y === y) && !(gold && gold.x === x && gold.y === y)) return { x, y };
    }
    return null;
  }

  function reset() {
    const cy = (ROWS / 2) | 0;
    snake = [{ x: 6, y: cy }, { x: 5, y: cy }, { x: 4, y: cy }];
    dir = [1, 0]; queue = []; grow = 0;
    score = 0; eaten = 0; speed = 0.16; stepT = 0; newRecord = false;
    food = null; gold = null; pops = [];
    food = freeCell();
    best = PX.best(bestKey());
    state = "play"; stateT = 0;
  }

  function turn(d) {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d[0] === -last[0] && d[1] === -last[1]) return; // 不能直接掉頭
    if (d[0] === last[0] && d[1] === last[1]) return;
    if (queue.length < 2) queue.push(d);
  }

  function die() {
    state = "over"; stateT = 0; flash = 0.3;
    PX.beep(220, 0.15, "square", 0.07, -120);
    setTimeout(() => PX.beep(110, 0.3, "square", 0.07, -60), 150);
    if (score > best) { best = score; PX.best(bestKey(), score); newRecord = true; }
  }

  function advance() {
    if (queue.length) dir = queue.shift();
    const h = snake[0];
    let nx = h.x + dir[0], ny = h.y + dir[1];
    if (MODES[mode].key === "wrap") { nx = (nx + COLS) % COLS; ny = (ny + ROWS) % ROWS; }
    else if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { die(); return; }
    // 撞到自己（尾巴這一步會移開，所以不算）
    const willMoveTail = grow === 0;
    for (let i = 0; i < snake.length - (willMoveTail ? 1 : 0); i++) {
      if (snake[i].x === nx && snake[i].y === ny) { die(); return; }
    }
    snake.unshift({ x: nx, y: ny });
    if (grow > 0) grow--; else snake.pop();

    if (food && nx === food.x && ny === food.y) {
      eaten++; grow += 1; score += 10;
      pops.push({ x: BX + nx * CELL + 4, y: BY + ny * CELL, text: "+10", c: C.white, t: 0 });
      PX.beep(660, 0.05); PX.beep(990, 0.06, "square", 0.04);
      food = freeCell();
      speed = Math.max(0.065, 0.16 - eaten * 0.0035);
      if (eaten % 5 === 0 && !gold) { gold = freeCell(); if (gold) gold.life = 6; }
    }
    if (gold && nx === gold.x && ny === gold.y) {
      const bonus = 30 + Math.ceil(gold.life) * 10;
      score += bonus; grow += 3;
      pops.push({ x: BX + nx * CELL + 4, y: BY + ny * CELL, text: `+${bonus}`, c: C.yellow, t: 0 });
      PX.beep(784, 0.06); setTimeout(() => PX.beep(1047, 0.1), 60);
      gold = null;
    }
    if (!food) die(); // 填滿整個棋盤（幾乎不可能）也當作結束
  }

  const inRect = (p, r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;

  const game = {
    width: W, height: H,
    update(dt, api) {
      t += dt; stateT += dt; flash = Math.max(0, flash - dt);
      const p = api.input.pointer;
      const tap = api.tapped();
      const released = wasDown && !p.down;
      wasDown = p.down;

      if (state === "title") {
        if (tap) MODES.forEach((m, i) => { if (inRect(p, modeBtn(i))) { mode = i; reset(); PX.beep(523, 0.08); } });
        if (api.hit(" ", "Enter")) reset();
        return;
      }
      if (state === "over") {
        if (stateT > 0.7) {
          if (tap && inRect(p, OVER_AGAIN)) reset();
          else if (tap && inRect(p, OVER_MENU)) { state = "title"; stateT = 0; }
          else if (api.hit(" ", "Enter")) reset();
        }
        return;
      }

      // 鍵盤
      if (api.hit("ArrowUp", "w")) turn([0, -1]);
      if (api.hit("ArrowDown", "s")) turn([0, 1]);
      if (api.hit("ArrowLeft", "a")) turn([-1, 0]);
      if (api.hit("ArrowRight", "d")) turn([1, 0]);
      // 方向鍵按鈕
      if (tap) {
        for (const k in PAD) if (inRect(p, PAD[k])) { turn(PAD[k].d); swipe = null; PAD[k].hot = 0.15; }
        if (p.y < BOARD_B + 4 && p.y > HUD_H) swipe = { x: p.x, y: p.y, used: false };
      }
      // 在棋盤上滑動
      if (swipe && p.down && !swipe.used) {
        const dx = p.x - swipe.x, dy = p.y - swipe.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
          turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
          swipe = { x: p.x, y: p.y, used: false }; // 不放開也能連續轉彎
        }
      }
      if (released) swipe = null;
      for (const k in PAD) if (PAD[k].hot) PAD[k].hot = Math.max(0, PAD[k].hot - dt);

      if (gold) { gold.life -= dt; if (gold.life <= 0) gold = null; }
      stepT += dt;
      while (stepT >= speed && state === "play") { stepT -= speed; advance(); }
      pops.forEach((q) => { q.t += dt; });
      pops = pops.filter((q) => q.t < 0.8);
    },
    draw(g) {
      // 棋盤：兩種綠色的草地格子
      g.clear(C.night);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++)
        g.rect(BX + x * CELL, BY + y * CELL, CELL, CELL, (x + y) % 2 ? "#2f7a4a" : "#3a8a55");
      g.rect(0, BY - 2, W, 2, MODES[mode].key === "wall" ? C.brown : "#3a8a55");
      g.rect(0, BOARD_B, W, 2, MODES[mode].key === "wall" ? C.brown : "#3a8a55");

      if (state !== "title") {
        if (food) g.draw(guava, BX + food.x * CELL, BY + food.y * CELL + (Math.floor(t * 3) % 2 ? -1 : 0));
        if (gold && (gold.life > 1.5 || Math.floor(t * 8) % 2)) g.draw(golden, BX + gold.x * CELL, BY + gold.y * CELL);
        // 毛毛蟲：從尾巴畫到頭
        for (let i = snake.length - 1; i >= 0; i--) {
          const s = snake[i], x = BX + s.x * CELL, y = BY + s.y * CELL;
          if (i === 0) drawHead(g, x, y);
          else if (i === snake.length - 1) g.draw(tail, x, y);
          else g.draw(i % 2 ? body : body2, x, y);
        }
        pops.forEach((q) => g.text(q.text, q.x, q.y - q.t * 16, q.c, { align: "center", shadow: C.ink }));
      }

      // 下方操作區
      g.rect(0, BOARD_B + 2, W, H - BOARD_B - 2, C.navy);
      const arrows = { up: "▲", left: "◀", down: "▼", right: "▶" };
      for (const k in PAD) {
        const r = PAD[k];
        g.rect(r.x, r.y, r.w, r.h, C.ink);
        g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, r.hot ? C.yellow : "#2c3d70");
        g.text(arrows[k], r.x + r.w / 2, r.y + 7, r.hot ? C.ink : C.white, { align: "center" });
      }

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.95)");
      g.text(`SCORE ${score}`, 2, -1, C.yellow);
      g.text(`BEST ${Math.max(best, score)}`, W - 2, -1, C.light, { align: "right" });

      const panel = (y, h) => { g.rect(10, y, W - 20, h, C.white); g.rect(12, y + 2, W - 24, h - 4, C.navy); };
      if (state === "title") {
        g.text("毛毛蟲", W / 2, 30, C.lime, { align: "center", size: 24, shadow: C.ink });
        g.text("吃芭樂", W / 2, 58, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.text("GUAVA SNAKE", W / 2, 88, C.white, { align: "center", shadow: C.ink });
        g.text("吃芭樂會變長，別撞到自己", W / 2, 108, C.white, { align: "center", shadow: C.ink });
        MODES.forEach((m, i) => {
          const r = modeBtn(i);
          g.rect(r.x, r.y, r.w, r.h, C.ink); g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, i ? C.lime : C.yellow);
          g.text(m.name, r.x + r.w / 2, r.y + 1, C.ink, { align: "center" });
          g.text(`${m.desc}・最高 ${PX.best(`guava-snake-${m.key}`)}`, r.x + r.w / 2, r.y + 14, C.navy, { align: "center" });
        });
      }
      if (state === "over") {
        if (flash > 0) g.rect(0, BY, W, ROWS * CELL, "rgba(255,0,77,0.3)");
        panel(56, 104);
        g.text("GAME OVER", W / 2, 64, C.red, { align: "center", size: 16, shadow: C.ink });
        g.text(`SCORE ${score}`, W / 2, 88, C.white, { align: "center" });
        g.text(`長度 ${snake.length}・吃了 ${eaten} 顆`, W / 2, 102, C.light, { align: "center" });
        g.text(newRecord ? "NEW RECORD!" : `BEST ${best}`, W / 2, 116, newRecord ? C.yellow : C.light, { align: "center" });
        if (stateT > 0.7) {
          for (const [r, label, col] of [[OVER_AGAIN, "再玩一次", C.yellow], [OVER_MENU, "選模式", C.light]]) {
            g.rect(r.x, r.y, r.w, r.h, C.ink); g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, col);
            g.text(label, r.x + r.w / 2, r.y + 2, C.ink, { align: "center" });
          }
        }
      }
    },
  };

  // 頭依照方向旋轉
  function drawHead(g, x, y) {
    const ctx = g.ctx;
    const a = Math.atan2(dir[1], dir[0]);
    ctx.save();
    ctx.translate(x + CELL / 2, y + CELL / 2);
    ctx.rotate(a);
    ctx.drawImage(head, -CELL / 2, -CELL / 2);
    ctx.restore();
  }

  const canvas = document.getElementById("game");
  if (canvas) PX.run(canvas, game);
})();
