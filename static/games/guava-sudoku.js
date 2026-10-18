/* 芭樂數獨 Guava Sudoku */
(() => {
  const { C } = PX;
  const W = 160, H = 290;
  const HUD_H = 12;
  const BAR_Y = 14;                 // 難度、錯誤數、時間
  const CELL = 16;                  // 每格 15 + 1 條格線
  const BX = 6, BY = 30;            // 棋盤左上角
  const BOARD = 9 * CELL + 3;       // 九宮格之間多 1px 粗線
  const PAD_Y = BY + BOARD + 8;     // 數字鍵
  const LEVELS = [
    { key: "easy", name: "簡單", givens: 42, col: C.lime },
    { key: "normal", name: "普通", givens: 34, col: C.yellow },
    { key: "hard", name: "困難", givens: 29, col: C.orange },
    { key: "expert", name: "特難", givens: 25, col: C.red },
    { key: "hell", name: "地獄", givens: 22, col: C.plum },
  ];

  // ── 出題：先亂數填滿一個完整的盤面，再一格一格挖空，挖完還是唯一解才保留 ──
  const ROW = (i) => (i / 9) | 0, COL = (i) => i % 9, BOX = (i) => ((ROW(i) / 3) | 0) * 3 + ((COL(i) / 3) | 0);
  const UNITS = [];
  for (let r = 0; r < 9; r++) UNITS.push({ kind: "row", n: r, cells: Array.from({ length: 9 }, (_, c) => r * 9 + c) });
  for (let c = 0; c < 9; c++) UNITS.push({ kind: "col", n: c, cells: Array.from({ length: 9 }, (_, r) => r * 9 + c) });
  for (let b = 0; b < 9; b++) {
    const cells = [];
    for (let k = 0; k < 9; k++) cells.push((((b / 3) | 0) * 3 + ((k / 3) | 0)) * 9 + (b % 3) * 3 + (k % 3));
    UNITS.push({ kind: "box", n: b, cells });
  }
  const PEERS = Array.from({ length: 81 }, (_, i) => {
    const s = new Set();
    for (const u of UNITS) if (u.cells.includes(i)) u.cells.forEach((j) => j !== i && s.add(j));
    return [...s];
  });
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // 計算解的數量（找到 limit 個就停）
  function countSolutions(g, limit) {
    let count = 0;
    const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
    for (let i = 0; i < 81; i++) if (g[i]) { const b = 1 << g[i]; rows[ROW(i)] |= b; cols[COL(i)] |= b; boxes[BOX(i)] |= b; }
    const rec = () => {
      // 找候選最少的空格
      let best = -1, bestMask = 0, bestN = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const used = rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)];
        let n = 0, mask = 0;
        for (let v = 1; v <= 9; v++) if (!(used & (1 << v))) { n++; mask |= 1 << v; }
        if (n < bestN) { bestN = n; best = i; bestMask = mask; if (n <= 1) break; }
      }
      if (best < 0) { count++; return; }
      for (let v = 1; v <= 9 && count < limit; v++) {
        if (!(bestMask & (1 << v))) continue;
        const b = 1 << v;
        g[best] = v; rows[ROW(best)] |= b; cols[COL(best)] |= b; boxes[BOX(best)] |= b;
        rec();
        g[best] = 0; rows[ROW(best)] &= ~b; cols[COL(best)] &= ~b; boxes[BOX(best)] &= ~b;
      }
    };
    rec();
    return count;
  }

  function fullGrid() {
    const g = new Array(81).fill(0);
    const fill = (i) => {
      if (i === 81) return true;
      for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (PEERS[i].some((j) => g[j] === v)) continue;
        g[i] = v;
        if (fill(i + 1)) return true;
      }
      g[i] = 0;
      return false;
    };
    fill(0);
    return g;
  }

  function makePuzzle(givens) {
    const sol = fullGrid();
    const puz = sol.slice();
    let left = 81;
    // 用對稱的方式挖洞，看起來比較整齊
    for (const i of shuffle([...Array(41).keys()])) {
      if (left <= givens) break;
      const j = 80 - i;
      const a = puz[i], b = puz[j];
      puz[i] = 0; puz[j] = 0;
      if (countSolutions(puz.slice(), 2) !== 1) { puz[i] = a; puz[j] = b; continue; }
      left -= i === j ? 1 : 2;
    }
    // 對稱挖不下去時，再一格一格試
    for (const i of shuffle([...Array(81).keys()])) {
      if (left <= givens) break;
      if (!puz[i]) continue;
      const a = puz[i];
      puz[i] = 0;
      if (countSolutions(puz.slice(), 2) !== 1) puz[i] = a; else left--;
    }
    return { sol, puz, left };
  }
  // 難的題目要多出幾次，挑提示最少的（最多花 0.6 秒）
  function bestPuzzle(givens) {
    const t0 = Date.now();
    let bestP = makePuzzle(givens);
    while (bestP.left > givens && Date.now() - t0 < 600) {
      const p = makePuzzle(givens);
      if (p.left < bestP.left) bestP = p;
    }
    return bestP;
  }
  window.GuavaSudokuGen = { makePuzzle: bestPuzzle, countSolutions };

  // ── 小字型：筆記用的 3×5 數字 ──
  const MINI = {
    1: [".#.", "##.", ".#.", ".#.", "###"], 2: ["##.", "..#", ".#.", "#..", "###"], 3: ["##.", "..#", ".#.", "..#", "##."],
    4: ["#.#", "#.#", "###", "..#", "..#"], 5: ["###", "#..", "##.", "..#", "##."], 6: [".##", "#..", "###", "#.#", "###"],
    7: ["###", "..#", ".#.", ".#.", ".#."], 8: ["###", "#.#", "###", "#.#", "###"], 9: ["###", "#.#", "###", "..#", "##."],
  };
  const miniSpr = {};
  for (const k in MINI) miniSpr[k] = PX.sprite(MINI[k], { "#": "#5a6088" });

  // ── 狀態 ──
  let state = "title";  // title / play / win
  let t = 0, stateT = 0;
  let lv = 0;
  let sol = [], given = [], val = [], notes = [];
  let sel = -1, noteMode = false;
  let mistakes = 0, hints = 0, time = 0;
  let undo = [];
  let done = new Set();            // 已完成的列／欄／宮
  let flashes = [], particles = [], pops = [];
  let best = 0, newRecord = false, finalSec = 0;
  const HINT_PENALTY = 30;

  const cellX = (i) => BX + COL(i) * CELL + ((COL(i) / 3) | 0) + 1;
  const cellY = (i) => BY + ROW(i) * CELL + ((ROW(i) / 3) | 0) + 1;
  const PAD = Array.from({ length: 9 }, (_, k) => ({ v: k + 1, x: 4 + (k % 5) * 31, y: PAD_Y + ((k / 5) | 0) * 30, w: 28, h: 26 }));
  const ERASE = { x: 4 + 4 * 31, y: PAD_Y + 30, w: 28, h: 26 };
  const TOOLS_Y = PAD_Y + 62;
  const TOOLS = [
    { key: "undo", label: "復原", x: 4 },
    { key: "note", label: "筆記", x: 57 },
    { key: "hint", label: "提示", x: 110 },
  ].map((b) => ({ ...b, y: TOOLS_Y, w: 46, h: 20 }));
  const RESTART = { x: W - 24, y: 0, w: 12, h: HUD_H }, MENU = { x: W - 12, y: 0, w: 12, h: HUD_H };
  const diffBtn = (i) => ({ x: 20, y: 112 + i * 30, w: 120, h: 26 });
  const WIN_AGAIN = { x: 22, y: 172, w: 56, h: 18 }, WIN_MENU = { x: 82, y: 172, w: 56, h: 18 };
  const inRect = (p, r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;

  function start(i) {
    lv = i;
    const pz = bestPuzzle(LEVELS[i].givens);
    sol = pz.sol; given = pz.puz.map((v) => v > 0); val = pz.puz.slice();
    notes = Array.from({ length: 81 }, () => new Set());
    sel = -1; noteMode = false; mistakes = 0; hints = 0; time = 0; undo = [];
    done = new Set(); flashes = []; particles = []; pops = []; newRecord = false;
    // 一開始就完成的單位不算
    for (let u = 0; u < 27; u++) if (UNITS[u].cells.every((c) => val[c] === sol[c])) done.add(u);
    best = PX.best(`guava-sudoku-${LEVELS[i].key}`);
    state = "play"; stateT = 0;
  }

  function place(i, v, fromHint = false) {
    if (i < 0 || given[i]) return;
    if (noteMode && v && !fromHint) {
      if (val[i]) return;
      undo.push({ i, val: val[i], notes: new Set(notes[i]) });
      notes[i].has(v) ? notes[i].delete(v) : notes[i].add(v);
      PX.beep(880, 0.03, "square", 0.03);
      return;
    }
    if (val[i] === v) return;
    // 存起來給「復原」用（連同會被自動清掉的筆記）
    const peerNotes = PEERS[i].filter((j) => v && notes[j].has(v));
    undo.push({ i, val: val[i], notes: new Set(notes[i]), peers: peerNotes, v });
    val[i] = v; notes[i].clear();
    if (!v) { PX.beep(300, 0.04, "triangle", 0.04); return; }
    peerNotes.forEach((j) => notes[j].delete(v));
    if (v !== sol[i]) {
      mistakes++;
      pops.push({ x: cellX(i) + 7, y: cellY(i) - 4, text: "不對喔", c: C.red, t: 0 });
      PX.beep(160, 0.15, "square", 0.06, -40);
      return;
    }
    PX.beep(660, 0.05, "square", 0.04);
    checkUnits(i);
  }

  // 整列、整欄、整個九宮格完成時的特效
  function checkUnits(i) {
    const names = { row: "橫列", col: "直欄", box: "九宮格" };
    let n = 0;
    UNITS.forEach((u, k) => {
      if (done.has(k) || !u.cells.includes(i)) return;
      if (!u.cells.every((c) => val[c] === sol[c])) return;
      done.add(k);
      // 從剛填的格子往外擴散
      const order = u.cells.slice().sort((a, b) =>
        Math.hypot(COL(a) - COL(i), ROW(a) - ROW(i)) - Math.hypot(COL(b) - COL(i), ROW(b) - ROW(i)));
      order.forEach((c, j) => flashes.push({ c, delay: j * 0.045 + n * 0.12, t: 0, col: [C.lime, C.yellow, C.pink][n % 3] }));
      pops.push({ x: W / 2, y: BY + BOARD / 2 - 8 + n * 14, text: `${names[u.kind]}完成！`, c: [C.lime, C.yellow, C.pink][n % 3], t: -n * 0.12, big: true });
      setTimeout(() => { PX.beep(784, 0.06); PX.beep(1047, 0.08, "square", 0.04); }, n * 120);
      n++;
    });
    if (val.every((v, k) => v === sol[k])) win();
  }

  function win() {
    state = "win"; stateT = 0;
    // 每用一次提示加 30 秒，才不會靠提示刷紀錄
    const sec = Math.floor(time) + hints * HINT_PENALTY;
    finalSec = sec;
    if (!best || sec < best) { best = sec; PX.best(`guava-sudoku-${LEVELS[lv].key}`, sec); newRecord = true; }
    // 全盤放煙火
    for (let k = 0; k < 81; k++) flashes.push({ c: k, delay: (ROW(k) + COL(k)) * 0.05, t: 0, col: [C.lime, C.yellow, C.pink, C.blue][(ROW(k) + COL(k)) % 4] });
    for (let k = 0; k < 6; k++) setTimeout(() => burst(20 + Math.random() * 120, 40 + Math.random() * 100, 24), k * 200);
    [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => PX.beep(f, 0.12), k * 110));
  }

  function burst(x, y, n) {
    const cols = [C.yellow, C.pink, C.lime, C.blue, C.white, C.orange];
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 70;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, life: 0.6 + Math.random() * 0.6, c: cols[(Math.random() * cols.length) | 0] });
    }
  }

  function doUndo() {
    const u = undo.pop();
    if (!u) return;
    val[u.i] = u.val; notes[u.i] = u.notes;
    if (u.peers) u.peers.forEach((j) => notes[j].add(u.v));
    sel = u.i;
    PX.beep(400, 0.04, "triangle", 0.04);
  }

  function doHint() {
    let i = sel >= 0 && !given[sel] && val[sel] !== sol[sel] ? sel : -1;
    if (i < 0) {
      const empty = [...Array(81).keys()].filter((k) => val[k] !== sol[k]);
      if (!empty.length) return;
      i = empty[(Math.random() * empty.length) | 0];
    }
    sel = i; hints++;
    const keep = noteMode; noteMode = false;
    place(i, sol[i], true);
    noteMode = keep;
    pops.push({ x: cellX(i) + 7, y: cellY(i) - 4, text: "提示", c: C.yellow, t: 0 });
  }

  const remaining = (v) => 9 - val.filter((x, k) => x === v && x === sol[k]).length;

  const game = {
    width: W, height: H,
    update(dt, api) {
      t += dt; stateT += dt;
      const p = api.input.pointer;
      const tap = api.tapped();

      for (const f of flashes) f.t += dt;
      flashes = flashes.filter((f) => f.t < f.delay + 0.6);
      for (const q of particles) { q.vy += 90 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.t += dt; }
      particles = particles.filter((q) => q.t < q.life);
      // 特效：格子閃到一半時噴出小星星
      for (const f of flashes) if (!f.burst && f.t > f.delay) { f.burst = true; burstSmall(cellX(f.c) + 7, cellY(f.c) + 7, f.col); }
      pops.forEach((q) => { q.t += dt; });
      pops = pops.filter((q) => q.t < (q.big ? 1.3 : 0.8));

      if (state === "title") {
        if (tap) LEVELS.forEach((_, i) => { if (inRect(p, diffBtn(i))) { start(i); PX.beep(523, 0.08); } });
        if (api.hit(" ", "Enter")) start(0);
        return;
      }
      if (tap && inRect(p, MENU)) { state = "title"; stateT = 0; return; }
      if (state === "win") {
        if (stateT > 1 && tap) {
          if (inRect(p, WIN_AGAIN)) start(lv);
          else if (inRect(p, WIN_MENU)) { state = "title"; stateT = 0; }
        }
        return;
      }
      if (tap && inRect(p, RESTART)) { start(lv); return; }
      time += dt;

      if (tap) {
        // 點棋盤
        if (p.x >= BX && p.x < BX + BOARD && p.y >= BY && p.y < BY + BOARD) {
          const c = Math.min(8, Math.floor((p.x - BX - ((p.x - BX) / (3 * CELL + 1) | 0)) / CELL));
          const r = Math.min(8, Math.floor((p.y - BY - ((p.y - BY) / (3 * CELL + 1) | 0)) / CELL));
          sel = r * 9 + c;
          PX.beep(520, 0.02, "square", 0.02);
        }
        for (const b of PAD) if (inRect(p, b)) place(sel, b.v);
        if (inRect(p, ERASE) && sel >= 0 && !given[sel]) { if (val[sel]) place(sel, 0); else if (notes[sel].size) { undo.push({ i: sel, val: 0, notes: new Set(notes[sel]) }); notes[sel].clear(); } }
        for (const b of TOOLS) if (inRect(p, b)) {
          if (b.key === "undo") doUndo();
          if (b.key === "note") { noteMode = !noteMode; PX.beep(noteMode ? 700 : 500, 0.04); }
          if (b.key === "hint") doHint();
        }
      }
      // 鍵盤
      const mv = [["ArrowLeft", 0, -1], ["ArrowRight", 0, 1], ["ArrowUp", -1, 0], ["ArrowDown", 1, 0]];
      for (const [k, dr, dc] of mv) if (api.hit(k)) {
        if (sel < 0) sel = 40;
        else sel = ((ROW(sel) + dr + 9) % 9) * 9 + (COL(sel) + dc + 9) % 9;
      }
      for (let v = 1; v <= 9; v++) if (api.hit(String(v))) place(sel, v);
      if (api.hit("Backspace", "Delete", "0")) place(sel, 0);
      if (api.hit("n")) noteMode = !noteMode;
      if (api.hit("z")) doUndo();
    },
    draw(g) {
      g.clear("#1d2b53");
      if (state === "title") { drawTitle(g); return; }

      const sv = sel >= 0 ? val[sel] : 0;
      // 棋盤底
      g.rect(BX, BY, BOARD, BOARD, C.ink);
      for (let i = 0; i < 81; i++) {
        const x = cellX(i), y = cellY(i);
        let bg = "#fff6e6";
        if (sel >= 0) {
          // 點一格時，把它的整列、整欄和九宮格反灰：這些格子都不能再出現同一個數字
          if (ROW(i) === ROW(sel) || COL(i) === COL(sel) || BOX(i) === BOX(sel)) bg = "#cfc6d8";
          if (sv && val[i] === sv) bg = "#c8f0a0";
          if (i === sel) bg = C.yellow;
        }
        g.rect(x, y, CELL - 1, CELL - 1, bg);
        if (val[i]) {
          const wrong = val[i] !== sol[i];
          const col = given[i] ? C.ink : wrong ? C.red : "#1d6fd0";
          g.text(String(val[i]), x + 8, y + 1, col, { align: "center" });
          // 和選取的數字衝突（同列／欄／宮重複）就畫紅框
          if (wrong && sel >= 0 && i !== sel && sv === val[i]) g.rect(x, y + CELL - 3, CELL - 1, 1, C.red);
        } else if (notes[i].size) {
          for (const v of notes[i]) g.draw(miniSpr[v], x + 1 + ((v - 1) % 3) * 5, y + 1 + (((v - 1) / 3) | 0) * 5);
        }
      }
      // 完成特效：格子依序閃光
      for (const f of flashes) {
        const k = (f.t - f.delay) / 0.6;
        if (k < 0 || k > 1) continue;
        g.ctx.globalAlpha = 1 - k;
        g.rect(cellX(f.c), cellY(f.c), CELL - 1, CELL - 1, f.col);
        g.ctx.globalAlpha = 1;
        if (k < 0.5) g.text(String(val[f.c]), cellX(f.c) + 8, cellY(f.c) + 1 - Math.round(Math.sin(k * Math.PI * 2) * 2), C.ink, { align: "center" });
      }
      particles.forEach((q) => g.rect(q.x, q.y, 1, 1, q.c));
      pops.forEach((q) => {
        if (q.t < 0) return;
        const yy = q.big ? q.y - Math.min(q.t, 0.3) * 20 : q.y - q.t * 14;
        g.text(q.text, q.x, yy, q.c, { align: "center", shadow: C.ink, size: q.big ? 16 : 12 });
      });

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.95)");
      g.text(`數獨・${LEVELS[lv].name}`, 2, -1, C.yellow);
      g.text("↺", RESTART.x + 6, -1, C.white, { align: "center" });
      g.text("≡", MENU.x + 6, -1, C.white, { align: "center" });
      g.text(`錯 ${mistakes}`, 4, BAR_Y, mistakes ? C.red : C.light);
      g.text(`提示 ${hints}`, W / 2, BAR_Y, C.light, { align: "center" });
      const sec = Math.floor(time);
      g.text(`${(sec / 60) | 0}:${String(sec % 60).padStart(2, "0")}`, W - 4, BAR_Y, C.white, { align: "right" });

      // 數字鍵（顯示每個數字還剩幾個要填）
      for (const b of PAD) {
        const left = remaining(b.v), off = left === 0;
        g.rect(b.x, b.y, b.w, b.h, C.ink);
        g.rect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, off ? "#2c3d70" : noteMode ? "#d8ccf0" : "#fff1e8");
        g.text(String(b.v), b.x + b.w / 2, b.y + 3, off ? C.gray : noteMode ? C.lavender : C.ink, { align: "center", size: 16 });
        if (!off) g.draw(miniSpr[left], b.x + b.w - 5, b.y + b.h - 7);
      }
      g.rect(ERASE.x, ERASE.y, ERASE.w, ERASE.h, C.ink);
      g.rect(ERASE.x + 1, ERASE.y + 1, ERASE.w - 2, ERASE.h - 2, "#e8c890");
      g.text("擦", ERASE.x + ERASE.w / 2, ERASE.y + 6, C.ink, { align: "center" });
      for (const b of TOOLS) {
        const on = b.key === "note" && noteMode;
        g.rect(b.x, b.y, b.w, b.h, on ? C.white : C.gray);
        g.rect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, on ? C.lavender : "#2c3d70");
        g.text(b.key === "note" ? (noteMode ? "筆記 ON" : "筆記") : b.label, b.x + b.w / 2, b.y + 3, C.white, { align: "center" });
      }

      if (state === "win" && stateT > 1) {
        g.rect(10, 110, W - 20, 90, C.white); g.rect(12, 112, W - 24, 86, C.navy);
        g.text("全部完成！", W / 2, 118, C.yellow, { align: "center", size: 16, shadow: C.ink });
        g.text(`${LEVELS[lv].name}・${(finalSec / 60) | 0} 分 ${finalSec % 60} 秒`, W / 2, 134, C.white, { align: "center" });
        if (hints) g.text(`（含提示 ${hints} 次 +${hints * HINT_PENALTY} 秒）`, W / 2, 146, C.light, { align: "center" });
        g.text(newRecord ? "NEW RECORD!" : `最快 ${(best / 60) | 0} 分 ${best % 60} 秒`, W / 2, 158, newRecord ? C.yellow : C.light, { align: "center" });
        for (const [r, label, col] of [[WIN_AGAIN, "再一題", C.yellow], [WIN_MENU, "選難度", C.light]]) {
          g.rect(r.x, r.y, r.w, r.h, C.ink); g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, col);
          g.text(label, r.x + r.w / 2, r.y + 2, C.ink, { align: "center" });
        }
      }
    },
  };

  function burstSmall(x, y, col) {
    for (let k = 0; k < 4; k++) {
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 30;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 15, t: 0, life: 0.4 + Math.random() * 0.3, c: k ? col : C.white });
    }
  }

  function drawTitle(g) {
    // 背景：一小塊示範盤面
    const demo = [5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0];
    for (let k = 0; k < 18; k++) {
      const x = 4 + (k % 9) * 17, y = H - 38 + ((k / 9) | 0) * 17;
      g.rect(x, y, 16, 16, k % 9 === 4 || ((k / 9) | 0) === 1 ? "#cfc6d8" : "#fff6e6");
      if (demo[k]) g.text(String(demo[k]), x + 8, y + 1, C.ink, { align: "center" });
    }
    g.text("芭樂", W / 2, 14, C.lime, { align: "center", size: 24, shadow: C.ink });
    g.text("數獨", W / 2, 40, C.pink, { align: "center", size: 24, shadow: C.ink });
    g.text("GUAVA SUDOKU", W / 2, 68, C.white, { align: "center", shadow: C.ink });
    g.text("每列、每欄、每個九宮格", W / 2, 84, C.white, { align: "center" });
    g.text("都要填入 1～9 不重複", W / 2, 96, C.yellow, { align: "center" });
    LEVELS.forEach((d, i) => {
      const r = diffBtn(i), dark = i >= 3;
      g.rect(r.x, r.y, r.w, r.h, C.ink);
      g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, d.col);
      const b = PX.best(`guava-sudoku-${d.key}`);
      g.text(`${d.name}・提示約 ${d.givens} 格`, r.x + r.w / 2, r.y + 1, dark ? C.white : C.ink, { align: "center" });
      g.text(b ? `最快 ${(b / 60) | 0} 分 ${b % 60} 秒` : "還沒完成過", r.x + r.w / 2, r.y + 13, dark ? C.peach : C.navy, { align: "center" });
    });
  }

  const canvas = document.getElementById("game");
  if (canvas) PX.run(canvas, game);
})();
