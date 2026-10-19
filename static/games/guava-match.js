/* 芭樂消消樂 Guava Match */
(() => {
  const { C } = PX;
  const W = 160, H = 290;
  const HUD_H = 12;
  const N = 8, CELL = 18;
  const BX = 8, BY = 62;
  const TYPES = 6;
  const NAMES = ["芭樂", "草莓", "橘子", "葡萄", "藍莓", "檸檬"];

  // ── 關卡 ──
  // goal：score 分數、collect 收集水果、ice 打碎全部冰塊、crate 打破全部木箱
  const LEVELS = [
    { name: "新手果園", moves: 15, goal: { score: 5000 }, stars: [5000, 7500, 10000],
      tip: "三個連成一線就會消除\n四連可以做出條紋水果" },
    { name: "芭樂收成", moves: 22, goal: { collect: { 0: 22, 3: 22 } }, stars: [0, 9000, 14000],
      tip: "收集上方指定的水果\nL 形可以做出炸彈" },
    { name: "冰凍果園", moves: 24, goal: { ice: true }, stars: [0, 10000, 15000],
      ice: ["........", ".111111.", ".1....1.", ".1.22.1.", ".1.22.1.", ".1....1.", ".111111.", "........"],
      tip: "在冰塊上面消除水果\n深藍色的冰要敲兩次" },
    { name: "木箱倉庫", moves: 30, goal: { crate: true }, stars: [0, 12000, 18000],
      crate: ["........", "........", "........", "........", "........", "11....11", "11111111", "11111111"],
      tip: "在木箱旁邊消除\n或用特殊水果打破它" },
    { name: "大豐收", moves: 18, goal: { ice: true, collect: { 2: 28 } }, stars: [0, 14000, 20000],
      ice: ["........", "........", "..2222..", "..2222..", "..2222..", "..2222..", "........", "........"],
      crate: ["........", "........", "........", "........", "........", "........", "1......1", "11....11"],
      tip: "最後一關！五連做出彩虹\n可以一次清光橘子" },
  ];

  // ── 盤面與規則（可以不畫圖單獨執行，給模擬器用） ──
  let nextId = 1;
  const newPiece = (t, sp = null) => ({ id: nextId++, t, sp, x: 0, y: 0 });
  const inB = (r, c) => r >= 0 && c >= 0 && r < N && c < N;

  function makeBoard(L, rnd = Math.random) {
    const b = { grid: [], ice: [], crate: [], cleared: Array(TYPES).fill(0), score: 0, events: [] };
    for (let r = 0; r < N; r++) {
      b.grid.push([]); b.ice.push([]); b.crate.push([]);
      for (let c = 0; c < N; c++) {
        b.ice[r].push(L.ice ? +L.ice[r][c] || 0 : 0);
        b.crate[r].push(L.crate ? +L.crate[r][c] || 0 : 0);
        if (b.crate[r][c]) { b.grid[r].push(null); continue; }
        // 一開始不要有現成的三連
        let t;
        do t = (rnd() * TYPES) | 0;
        while ((c >= 2 && b.grid[r][c - 1] && b.grid[r][c - 2] && b.grid[r][c - 1].t === t && b.grid[r][c - 2].t === t) ||
               (r >= 2 && b.grid[r - 1][c] && b.grid[r - 2][c] && b.grid[r - 1][c].t === t && b.grid[r - 2][c].t === t));
        b.grid[r].push(newPiece(t));
      }
    }
    if (!hasMove(b)) return makeBoard(L, rnd);
    return b;
  }

  // 找出所有三連以上的組合；橫直相交的會合併（L／T 形）
  function findGroups(b) {
    const runs = [];
    const same = (r1, c1, r2, c2) => {
      const a = b.grid[r1][c1], d = b.grid[r2][c2];
      return a && d && a.t >= 0 && a.t === d.t;
    };
    for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
      let e = c + 1;
      while (e < N && same(r, c, r, e)) e++;
      if (e - c >= 3) runs.push({ dir: "h", cells: Array.from({ length: e - c }, (_, k) => [r, c + k]) });
      c = e;
    }
    for (let c = 0; c < N; c++) for (let r = 0; r < N;) {
      let e = r + 1;
      while (e < N && same(r, c, e, c)) e++;
      if (e - r >= 3) runs.push({ dir: "v", cells: Array.from({ length: e - r }, (_, k) => [r + k, c]) });
      r = e;
    }
    // 合併有共用格子的 run
    const groups = [];
    for (const run of runs) {
      const keys = new Set(run.cells.map(([r, c]) => r * N + c));
      let g = groups.find((g) => [...keys].some((k) => g.keys.has(k)));
      if (g) { run.cells.forEach(([r, c]) => g.keys.add(r * N + c)); g.runs.push(run); }
      else groups.push({ keys, runs: [run] });
    }
    return groups;
  }

  function hasMove(b) { return !!findMove(b); }
  function findMove(b) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!inB(r2, c2) || !b.grid[r][c] || !b.grid[r2][c2]) continue;
        if (b.grid[r][c].sp && b.grid[r2][c2].sp) return [r, c, r2, c2];
        if (b.grid[r][c].sp === "rainbow" || b.grid[r2][c2].sp === "rainbow") return [r, c, r2, c2];
        swapCells(b, r, c, r2, c2);
        const ok = findGroups(b).length > 0;
        swapCells(b, r, c, r2, c2);
        if (ok) return [r, c, r2, c2];
      }
    }
    return null;
  }
  function swapCells(b, r1, c1, r2, c2) { const t = b.grid[r1][c1]; b.grid[r1][c1] = b.grid[r2][c2]; b.grid[r2][c2] = t; }

  // 清除一批格子：特殊水果會連鎖觸發，冰塊和木箱跟著受損
  function clearCells(b, start, chain, adjacentFrom = []) {
    const toClear = new Set(start);
    const queue = [...start];
    const crateHit = new Set();
    const hitArea = (r, c) => {
      if (!inB(r, c)) return;
      if (b.crate[r][c]) { crateHit.add(r * N + c); return; }
      const k = r * N + c;
      if (!toClear.has(k)) { toClear.add(k); queue.push(k); }
    };
    while (queue.length) {
      const k = queue.shift();
      const r = (k / N) | 0, c = k % N, p = b.grid[r][c];
      if (!p || !p.sp || p.used) continue;
      p.used = true;
      b.events.push({ type: "special", sp: p.sp, r, c });
      if (p.sp === "h") for (let cc = 0; cc < N; cc++) hitArea(r, cc);
      if (p.sp === "v") for (let rr = 0; rr < N; rr++) hitArea(rr, c);
      if (p.sp === "bomb") for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) hitArea(r + dr, c + dc);
      if (p.sp === "rainbow") {
        const t = p.colorTarget ?? mostCommon(b);
        for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) if (b.grid[rr][cc] && b.grid[rr][cc].t === t) hitArea(rr, cc);
      }
    }
    // 一般消除：旁邊的木箱也會被敲到
    for (const k of adjacentFrom) {
      const r = (k / N) | 0, c = k % N;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inB(r + dr, c + dc) && b.crate[r + dr][c + dc]) crateHit.add((r + dr) * N + c + dc);
    }
    const removed = [];
    for (const k of toClear) {
      const r = (k / N) | 0, c = k % N, p = b.grid[r][c];
      if (!p) continue;
      removed.push({ r, c, p });
      if (p.t >= 0) b.cleared[p.t]++;
      b.grid[r][c] = null;
      if (b.ice[r][c]) { b.ice[r][c]--; b.events.push({ type: "ice", r, c }); }
      b.score += 60 * chain + (p.sp ? 120 : 0);
    }
    for (const k of crateHit) {
      const r = (k / N) | 0, c = k % N;
      b.crate[r][c]--; b.score += 100;
      b.events.push({ type: "crate", r, c, broke: b.crate[r][c] === 0 });
    }
    return removed;
  }
  function mostCommon(b) {
    const cnt = Array(TYPES).fill(0);
    for (const row of b.grid) for (const p of row) if (p && p.t >= 0) cnt[p.t]++;
    return cnt.indexOf(Math.max(...cnt));
  }

  // 處理一次消除；回傳這次消掉的東西（沒有就回傳 null）
  function resolveOnce(b, chain, swapped) {
    const groups = findGroups(b);
    if (!groups.length) return null;
    const start = new Set(), created = [];
    for (const g of groups) {
      g.keys.forEach((k) => start.add(k));
      const longest = Math.max(...g.runs.map((r) => r.cells.length));
      let sp = null;
      if (longest >= 5) sp = "rainbow";
      else if (g.runs.length >= 2) sp = "bomb";
      else if (longest === 4) sp = g.runs[0].dir === "h" ? "v" : "h";
      if (!sp) continue;
      // 特殊水果放在玩家剛移動的那格，否則放在中間
      let at = [...g.keys].find((k) => swapped && swapped.includes(k));
      if (at === undefined) {
        if (g.runs.length >= 2) {
          const [a, d] = g.runs;
          at = [...a.cells.map(([r, c]) => r * N + c)].find((k) => d.cells.some(([r, c]) => r * N + c === k));
        } else at = g.runs[0].cells[(g.runs[0].cells.length / 2) | 0].reduce((r, c) => r * N + c);
      }
      const [r, c] = [(at / N) | 0, at % N];
      const t = b.grid[r][c].t;
      created.push({ r, c, t: sp === "rainbow" ? -1 : t, sp });
    }
    const removed = clearCells(b, [...start], chain, [...start]);
    for (const cr of created) {
      if (b.grid[cr.r][cr.c]) continue;
      const p = newPiece(cr.t, cr.sp);
      b.grid[cr.r][cr.c] = p;
      b.score += 200;
      b.events.push({ type: "create", sp: cr.sp, r: cr.r, c: cr.c, p });
    }
    return { removed, created };
  }

  // 兩個特殊水果交換、或彩虹和水果交換：直接觸發組合技
  function comboSwap(b, r1, c1, r2, c2) {
    const a = b.grid[r1][c1], d = b.grid[r2][c2];
    if (!a || !d) return null;
    const rb = a.sp === "rainbow" ? a : d.sp === "rainbow" ? d : null;
    const other = rb === a ? d : a;
    const [orr, occ] = rb === a ? [r2, c2] : [r1, c1];
    const k1 = r1 * N + c1, k2 = r2 * N + c2;
    let cells = [];
    if (rb && other.sp === "rainbow") {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push(r * N + c);
      a.used = d.used = true;
      b.events.push({ type: "combo", name: "彩虹 × 彩虹", r: r2, c: c2 });
    } else if (rb && other.sp) {
      // 同顏色的水果全部變成這種特殊水果，再一起引爆
      rb.used = true;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const p = b.grid[r][c];
        if (p && p.t === other.t) { if (!p.sp) p.sp = other.sp === "bomb" ? "bomb" : Math.random() < 0.5 ? "h" : "v"; cells.push(r * N + c); }
      }
      cells.push(rb === a ? k1 : k2);
      b.events.push({ type: "combo", name: "彩虹組合技", r: r2, c: c2 });
    } else if (rb) {
      rb.colorTarget = other.t;
      cells = [rb === a ? k1 : k2];
      b.events.push({ type: "combo", name: `清光${NAMES[other.t]}`, r: orr, c: occ });
    } else if (a.sp && d.sp) {
      a.used = d.used = true;
      const kinds = [a.sp, d.sp].map((s) => (s === "bomb" ? "b" : "s")).sort().join("");
      const area = (rr, cc) => { if (inB(rr, cc)) cells.push(rr * N + cc); };
      if (kinds === "ss") { for (let k = 0; k < N; k++) { area(r2, k); area(k, c2); } }
      else if (kinds === "bs") { for (let k = 0; k < N; k++) for (let o = -1; o <= 1; o++) { area(r2 + o, k); area(k, c2 + o); } }
      else for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) area(r2 + dr, c2 + dc);
      cells.push(k1, k2);
      b.events.push({ type: "combo", name: { ss: "十字閃電", bs: "超級條紋", bb: "大爆炸" }[kinds], r: r2, c: c2 });
      // 範圍裡的木箱也要算
      const crateCells = cells.filter((k) => b.crate[(k / N) | 0][k % N]);
      crateCells.forEach((k) => { const r = (k / N) | 0, c = k % N; b.crate[r][c]--; b.events.push({ type: "crate", r, c, broke: !b.crate[r][c] }); });
      cells = cells.filter((k) => !b.crate[(k / N) | 0][k % N] && !crateCells.includes(k));
    } else return null;
    clearCells(b, cells, 2, []);
    return true;
  }

  // 重力：木箱會擋住，木箱下面空出來的格子在原地長出新水果
  function gravity(b, rnd = Math.random) {
    const spawns = [];
    for (let c = 0; c < N; c++) {
      let r = N - 1;
      while (r >= 0) {
        if (b.crate[r][c]) { r--; continue; }
        // 一段沒有木箱的區間 [top, r]
        let top = r;
        while (top - 1 >= 0 && !b.crate[top - 1][c]) top--;
        const pieces = [];
        for (let k = r; k >= top; k--) if (b.grid[k][c]) pieces.push(b.grid[k][c]);
        let k = r;
        for (const p of pieces) b.grid[k--][c] = p;
        let n = 0;
        for (; k >= top; k--) {
          const p = newPiece((rnd() * TYPES) | 0);
          b.grid[k][c] = p;
          spawns.push({ p, r: k, c, n: n++, fromTop: top === 0 });
        }
        r = top - 1;
      }
    }
    return spawns;
  }

  function shuffleBoard(b, rnd = Math.random) {
    const ps = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b.grid[r][c]) ps.push(b.grid[r][c]);
    for (let tries = 0; tries < 50; tries++) {
      for (let i = ps.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [ps[i], ps[j]] = [ps[j], ps[i]]; }
      let k = 0;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b.grid[r][c]) b.grid[r][c] = ps[k++];
      if (!findGroups(b).length && hasMove(b)) return;
    }
  }

  function goalStatus(b, L) {
    const g = L.goal, parts = [];
    if (g.score) parts.push({ label: "分數", have: b.score, need: g.score });
    if (g.collect) for (const t in g.collect) parts.push({ label: NAMES[t], t: +t, have: Math.min(b.cleared[t], g.collect[t]), need: g.collect[t] });
    if (g.ice) { const left = b.ice.flat().filter((v) => v > 0).length; parts.push({ label: "冰塊", ice: true, left }); }
    if (g.crate) { const left = b.crate.flat().filter((v) => v > 0).length; parts.push({ label: "木箱", crate: true, left }); }
    const done = parts.every((p) => (p.need ? p.have >= p.need : p.left === 0));
    return { parts, done };
  }

  // 模擬器：整個回合（交換＋全部連鎖）一次跑完
  function playMove(b, m, rnd) {
    const [r1, c1, r2, c2] = m;
    swapCells(b, r1, c1, r2, c2);
    let chain = 1;
    if (!comboSwap(b, r1, c1, r2, c2)) {
      if (!findGroups(b).length) { swapCells(b, r1, c1, r2, c2); return false; }
    } else { gravity(b, rnd); chain = 2; }
    let swapped = [r1 * N + c1, r2 * N + c2];
    while (resolveOnce(b, chain, swapped)) { gravity(b, rnd); chain++; swapped = null; }
    if (!hasMove(b)) shuffleBoard(b, rnd);
    b.events.length = 0;
    return true;
  }
  window.GuavaMatchSim = { LEVELS, makeBoard, findGroups, swapCells, playMove, goalStatus, N, TYPES };

  // ═════════════════════════ 畫面 ═════════════════════════
  const pal = { K: C.ink, W: C.white };
  const FRUIT = [
    PX.sprite([ // 芭樂
      "......GG......", ".....GG.......", "....KKKKKK....", "..KKLLLLLLKK..", ".KLLWLLLLLLLK.", ".KLWPPPPPPLLK.", "KLLPPSPPSPPLLK",
      "KLLPPPPPPPPLLK", "KLLPPSPPSPPLLK", ".KLLPPPPPPLLK.", ".KLLLPPPPLLLK.", "..KKLLLLLLKK..", "....KKKKKK....", "..............",
    ], { ...pal, G: C.green, L: C.lime, P: C.pink, S: C.plum }),
    PX.sprite([ // 草莓
      "....G.GG.G....", ".....GGGG.....", "...KKGGGGKK...", "..KRRRGGRRRK..", ".KRWRRRRRYRRK.", ".KRRRYRRRRRRK.", ".KRRRRRRYRRRK.",
      ".KRYRRRRRRRYK.", "..KRRRYRRRRK..", "..KRRRRRRYRK..", "...KRYRRRRK...", "....KRRRRK....", ".....KRRK.....", "......KK......",
    ], { ...pal, G: C.green, R: C.red, Y: C.yellow }),
    PX.sprite([ // 橘子
      "......GG......", ".......G......", "....KKKKKK....", "..KKOOOOOOKK..", ".KOOWWOOOOOOK.", ".KOWOOOOOOOOK.", "KOOOOOOOOOOODK",
      "KOOOOOOOOOOODK", "KOOOOOOOOOOODK", ".KOOOOOOOOODK.", ".KOOOOOOOODDK.", "..KKOODDDDKK..", "....KKKKKK....", "..............",
    ], { ...pal, G: C.green, O: C.orange, D: "#d07000" }),
    PX.sprite([ // 葡萄
      "......GB......", ".....GGB......", "...KKK.KKK....", "..KPWPKPPPK...", "..KPPPKPPPK...", "...KKKPKKKK...", "..KPPPKPPPK...",
      "..KPWPKPPPK...", "...KKKPKKK....", "....KPPPK.....", "....KPWPK.....", ".....KKK......", "..............", "..............",
    ], { ...pal, G: C.green, B: C.brown, P: "#a050d0" }),
    PX.sprite([ // 藍莓
      "..............", ".....K.K.K....", "....KDKDKDK...", "...KKBBBBBKK..", "..KBBBBBBBBBK.", ".KBWWBBBBBBBK.", ".KBWBBBBBBBBK.",
      ".KBBBBBBBBBBK.", ".KBBBBBBBBBDK.", ".KBBBBBBBBDDK.", "..KBBBBBBDDK..", "...KKBBDDKK...", ".....KKKK.....", "..............",
    ], { ...pal, B: C.blue, D: "#1d6fd0" }),
    PX.sprite([ // 檸檬
      "..............", "..............", ".....KKKKK....", "...KKYYYYYKK..", "..KYWWYYYYYYK.", ".KYWYYYYYYYYYK", "KYYYYYYYYYYYYK",
      "KYYYYYYYYYYYYK", ".KYYYYYYYYYDK.", "..KYYYYYYYDDK.", "...KKYYYDDKK..", ".....KKKKK....", "..............", "..............",
    ], { ...pal, Y: C.yellow, D: "#d0b000" }),
  ];
  const RAINBOW = PX.sprite([
    "....KKKKKK....", "..KKRRRRRRKK..", ".KRROOOOOORRK.", ".KROOYYYYOORK.", "KROOYLLLLYOORK".slice(0, 14), "KROYLBBBBLYORK", "KROYLBWWBLYORK",
    "KROYLBWWBLYORK", "KROYLBBBBLYORK", ".KROYLLLLYORK.", ".KRROYYYYORRK.", "..KKRROOORKK..", "....KKKKKK....", "..............",
  ], { ...pal, R: C.red, O: C.orange, Y: C.yellow, L: C.lime, B: C.blue });

  const box = PX.sprite([
    "KKKKKKKKKKKKKKKKK", "KBBBBBBBBBBBBBBBK", "KBDDDDDDDDDDDDDBK", "KBDBBBBBBBBBBBDBK", "KBDBDBBBBBBBDBDBK", "KBDBBDBBBBBDBBDBK",
    "KBDBBBDBBBDBBBDBK", "KBDBBBBDBDBBBBDBK", "KBDBBBBBDBBBBBDBK", "KBDBBBBDBDBBBBDBK", "KBDBBBDBBBDBBBDBK", "KBDBBDBBBBBDBBDBK",
    "KBDBDBBBBBBBDBDBK", "KBDBBBBBBBBBBBDBK", "KBDDDDDDDDDDDDDBK", "KBBBBBBBBBBBBBBBK", "KKKKKKKKKKKKKKKKK",
  ], { K: C.ink, B: "#c88848", D: "#8a5228" });

  // ── 遊戲狀態 ──
  const SAVE = "guava-match";
  let state = "title";   // title / play / win / lose
  let t = 0, stateT = 0;
  let lv = 0, L = LEVELS[0], board = null;
  let moves = 0, chain = 1;
  let phase = "idle";    // idle / swap / back / clear / fall / bonus
  let swapPair = null, phaseT = 0;
  let sel = null, drag = null, wasDown = false;
  let dying = [], particles = [], pops = [], beams = [], shake = 0;
  let unlocked = Math.max(1, PX.best(SAVE + "-unlocked"));
  const starsGot = LEVELS.map((_, i) => PX.best(`${SAVE}-stars-${i}`));
  let finalStars = 0, reward = null, revived = false, hintT = 0, hintMove = null;

  const px = (c) => BX + c * CELL + 2, py = (r) => BY + r * CELL + 2;

  function start(i) {
    lv = i; L = LEVELS[i];
    board = makeBoard(L);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board.grid[r][c];
      if (p) { p.x = px(c); p.y = py(r) - 160 - (N - r) * 6; p.vy = 0; }
    }
    moves = L.moves; chain = 1; phase = "fall"; swapPair = null; sel = null; drag = null;
    dying = []; particles = []; pops = []; beams = []; shake = 0; reward = null; revived = false; hintT = 0; hintMove = null;
    state = "play"; stateT = 0;
  }

  // 水果往目標位置移動（掉落有加速度）
  function animatePieces(dt) {
    let busy = false;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = board.grid[r][c];
      if (!p) continue;
      const tx = px(c), ty = py(r);
      if (p.x !== tx) { const d = tx - p.x; p.x += Math.sign(d) * Math.min(Math.abs(d), 150 * dt); busy = true; }
      if (p.y < ty) {
        p.vy = (p.vy || 40) + 600 * dt;
        p.y = Math.min(ty, p.y + p.vy * dt);
        if (p.y >= ty) { p.vy = 0; p.land = 0.12; }
        busy = true;
      } else if (p.y > ty) { const d = ty - p.y; p.y += Math.sign(d) * Math.min(Math.abs(d), 150 * dt); busy = true; }
      if (p.land) p.land = Math.max(0, p.land - dt);
    }
    return busy;
  }

  function handleEvents() {
    for (const e of board.events) {
      const x = BX + e.c * CELL + 9, y = BY + e.r * CELL + 9;
      if (e.type === "special") {
        if (e.sp === "h") beams.push({ x: BX, y: y - 3, w: N * CELL, h: 6, t: 0 });
        if (e.sp === "v") beams.push({ x: x - 3, y: BY, w: 6, h: N * CELL, t: 0 });
        if (e.sp === "bomb") { beams.push({ x: x - 27, y: y - 27, w: 54, h: 54, t: 0 }); shake = Math.max(shake, 0.2); }
        if (e.sp === "rainbow") shake = Math.max(shake, 0.25);
        PX.beep(e.sp === "bomb" ? 120 : 900, 0.12, e.sp === "bomb" ? "sawtooth" : "square", 0.05, e.sp === "bomb" ? -60 : -500);
      } else if (e.type === "create") {
        pops.push({ x, y: y - 10, text: { h: "條紋！", v: "條紋！", bomb: "炸彈！", rainbow: "彩虹！" }[e.sp], c: C.yellow, t: 0 });
        e.p.x = px(e.c); e.p.y = py(e.r); e.p.pop = 0.3;
        PX.beep(1047, 0.1, "square", 0.04);
      } else if (e.type === "ice") {
        burst(x, y, 5, [C.white, "#a8e0ff"]);
      } else if (e.type === "crate") {
        burst(x, y, e.broke ? 12 : 6, ["#c88848", "#8a5228", C.peach]);
        PX.beep(e.broke ? 150 : 220, 0.08, "triangle", 0.06);
      } else if (e.type === "combo") {
        pops.push({ x: W / 2, y: BY + 60, text: e.name, c: C.pink, t: 0, big: true });
        shake = 0.35;
      }
    }
    board.events.length = 0;
  }

  function burst(x, y, n, cols) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 60;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, life: 0.4 + Math.random() * 0.4, c: cols[(Math.random() * cols.length) | 0] });
    }
  }

  function doClear(removed) {
    const cols = ["#9be070", C.red, C.orange, "#a050d0", C.blue, C.yellow];
    for (const { r, c, p } of removed) {
      dying.push({ p, t: 0, x: p.x, y: p.y });
      burst(BX + c * CELL + 9, BY + r * CELL + 9, 4, [p.t >= 0 ? cols[p.t] : C.white, C.white]);
    }
    if (removed.length) {
      PX.beep(400 + Math.min(chain, 8) * 90, 0.06, "square", 0.05);
      if (chain >= 2) pops.push({ x: W / 2, y: BY + N * CELL / 2 - 10, text: ["", "", "不錯！", "很棒！", "超讚！", "神手！"][Math.min(chain, 5)] || "神手！", c: C.lime, t: 0, big: true });
    }
  }

  function trySwap(r1, c1, r2, c2) {
    if (!inB(r2, c2) || !board.grid[r1][c1] || !board.grid[r2][c2] || phase !== "idle") return;
    swapCells(board, r1, c1, r2, c2);
    swapPair = [r1, c1, r2, c2]; phase = "swap"; sel = null; hintT = 0; hintMove = null;
    PX.beep(500, 0.04, "triangle", 0.04);
  }

  function stepPhase(dt) {
    const busy = animatePieces(dt) || dying.length > 0;
    phaseT += dt;
    if (busy) return;
    if (phase === "swap") {
      const [r1, c1, r2, c2] = swapPair;
      chain = 1;
      comboBefore = snapshot();
      if (comboSwap(board, r1, c1, r2, c2)) {
        moves--; chain = 2;
        collectRemoved(); handleEvents(); phase = "clear"; phaseT = 0; return;
      }
      comboBefore = null;
      const res = resolveOnce(board, chain, [r1 * N + c1, r2 * N + c2]);
      if (!res) { swapCells(board, r1, c1, r2, c2); phase = "back"; PX.beep(200, 0.06, "triangle", 0.04); return; }
      moves--;
      doClear(res.removed); handleEvents(); phase = "clear"; phaseT = 0;
    } else if (phase === "back") {
      phase = "idle";
    } else if (phase === "clear") {
      const spawns = gravity(board);
      for (const s of spawns) { s.p.x = px(s.c); s.p.y = s.fromTop ? BY - 18 - s.n * CELL : py(s.r); s.p.vy = 0; if (!s.fromTop) s.p.pop = 0.25; }
      phase = "fall";
    } else if (phase === "fall") {
      chain++;
      const res = resolveOnce(board, chain, null);
      if (res) { doClear(res.removed); handleEvents(); phase = "clear"; phaseT = 0; return; }
      // 連鎖結束
      chain = 1;
      if (!findMove(board)) { shuffleBoard(board); pops.push({ x: W / 2, y: BY + 60, text: "沒有可以消的了，重新洗牌", c: C.white, t: 0 }); }
      checkEnd();
      if (state === "play") phase = "idle";
    } else if (phase === "bonus") {
      // 剩下的步數：隨機把水果變成條紋並引爆
      if (moves > 0) {
        moves--;
        const cells = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (board.grid[r][c] && !board.grid[r][c].sp) cells.push([r, c]);
        if (cells.length) {
          const [r, c] = cells[(Math.random() * cells.length) | 0];
          board.grid[r][c].sp = Math.random() < 0.5 ? "h" : "v";
          const before = snapshot();
          clearCellsAnim([r * N + c], before);
          board.score += 300;
          phase = "bonusClear";
        }
      } else finish();
    } else if (phase === "bonusClear") {
      const spawns = gravity(board);
      for (const s of spawns) { s.p.x = px(s.c); s.p.y = s.fromTop ? BY - 18 - s.n * CELL : py(s.r); s.p.vy = 0; }
      phase = "bonusFall";
    } else if (phase === "bonusFall") {
      const res = resolveOnce(board, 2, null);
      if (res) { doClear(res.removed); handleEvents(); phase = "bonusClear"; return; }
      phase = "bonus";
    }
  }

  // 組合技／獎勵引爆時，比對前後盤面找出被清掉的水果來播動畫
  function snapshot() { return board.grid.map((row) => row.map((p) => p)); }
  let comboBefore = null;
  function collectRemoved() {
    if (!comboBefore) return;
    const removed = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (comboBefore[r][c] && !board.grid[r][c]) removed.push({ r, c, p: comboBefore[r][c] });
    doClear(removed); comboBefore = null;
  }
  function clearCellsAnim(cells, before) {
    clearCells(board, cells, 2, []);
    comboBefore = before; collectRemoved(); handleEvents();
  }

  function checkEnd() {
    const gs = goalStatus(board, L);
    if (gs.done) {
      state = "win"; stateT = 0; phase = "bonus";
      pops.push({ x: W / 2, y: BY + 50, text: "過關！", c: C.yellow, t: 0, big: true });
      [523, 659, 784].forEach((f, k) => setTimeout(() => PX.beep(f, 0.1), k * 100));
    } else if (moves <= 0) {
      state = "lose"; stateT = 0;
      reward = revived ? null : PX.requestReward("guava-match-moves");
    }
  }

  function finish() {
    phase = "done";
    const s = board.score;
    finalStars = s >= L.stars[2] ? 3 : s >= L.stars[1] ? 2 : 1;
    if (finalStars > starsGot[lv]) { starsGot[lv] = finalStars; PX.best(`${SAVE}-stars-${lv}`, finalStars); }
    if (lv + 2 > unlocked) { unlocked = Math.min(LEVELS.length, lv + 2); PX.best(SAVE + "-unlocked", unlocked); }
    const best = PX.best(`${SAVE}-score-${lv}`);
    if (s > best) PX.best(`${SAVE}-score-${lv}`, s);
    stateT = 0;
  }

  // ── 按鈕 ──
  const inRect = (p, r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
  const levelBtn = (i) => ({ x: 20, y: 110 + i * 32, w: 120, h: 28 });
  const RESTART = { x: W - 24, y: 0, w: 12, h: HUD_H }, MENU = { x: W - 12, y: 0, w: 12, h: HUD_H };
  const B1 = { x: 18, y: 176, w: 60, h: 20 }, B2 = { x: 82, y: 176, w: 60, h: 20 }, B3 = { x: 50, y: 200, w: 60, h: 16 };
  const REVIVE = { x: 18, y: 150, w: 124, h: 20 };

  const game = {
    width: W, height: H,
    update(dt, api) {
      t += dt; stateT += dt;
      const p = api.input.pointer;
      const tap = api.tapped();
      const released = wasDown && !p.down;
      wasDown = p.down;
      shake = Math.max(0, shake - dt);
      for (const q of particles) { q.vy += 120 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.t += dt; }
      particles = particles.filter((q) => q.t < q.life);
      dying.forEach((d) => { d.t += dt; }); dying = dying.filter((d) => d.t < 0.18);
      beams.forEach((b) => { b.t += dt; }); beams = beams.filter((b) => b.t < 0.3);
      pops.forEach((q) => { q.t += dt; }); pops = pops.filter((q) => q.t < (q.big ? 1 : 0.7));

      if (state === "title") {
        if (tap) LEVELS.forEach((_, i) => { if (i < unlocked && inRect(p, levelBtn(i))) { start(i); PX.beep(523, 0.08); } });
        return;
      }
      if (tap && inRect(p, MENU)) { state = "title"; stateT = 0; return; }
      if (tap && inRect(p, RESTART) && (state !== "play" || phase === "idle")) { start(lv); return; }

      if (state === "lose") {
        animatePieces(dt);
        if (reward && reward.result === "viewed") { addMoves(); return; }
        if (reward && reward.result === "dismissed") reward = null;
        if (stateT > 0.6 && tap) {
          if (reward && inRect(p, REVIVE)) { if (reward.status === "ready") reward.show(); else if (reward.status === "none") addMoves(); }
          else if (inRect(p, B1)) start(lv);
          else if (inRect(p, B2)) { state = "title"; stateT = 0; }
        }
        return;
      }
      if (state === "win") {
        stepPhase(dt);
        if (phase === "done" && stateT > 0.6 && tap) {
          if (inRect(p, B1) && lv < LEVELS.length - 1) start(lv + 1);
          else if (inRect(p, B2) || (inRect(p, B1) && lv === LEVELS.length - 1)) start(lv);
          else if (inRect(p, B3)) { state = "title"; stateT = 0; }
        }
        return;
      }

      stepPhase(dt);

      // ── 操作：拖曳交換，或點兩下相鄰的格子 ──
      const cellAt = (q) => {
        const c = Math.floor((q.x - BX) / CELL), r = Math.floor((q.y - BY) / CELL);
        return inB(r, c) ? [r, c] : null;
      };
      if (tap) {
        const cell = cellAt(p);
        if (cell && phase === "idle") {
          if (sel && Math.abs(sel[0] - cell[0]) + Math.abs(sel[1] - cell[1]) === 1) { trySwap(sel[0], sel[1], cell[0], cell[1]); drag = null; }
          else { sel = board.grid[cell[0]][cell[1]] ? cell : null; drag = sel ? { r: cell[0], c: cell[1], x: p.x, y: p.y } : null; }
        }
      }
      if (drag && p.down && phase === "idle") {
        const dx = p.x - drag.x, dy = p.y - drag.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
          const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
          trySwap(drag.r, drag.c, drag.r + dr, drag.c + dc);
          drag = null;
        }
      }
      // 很快的滑動（按下和放開在同一幀）就用放開的位置判斷
      if (released && drag && phase === "idle") {
        const dx = p.x - drag.x, dy = p.y - drag.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
          const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
          trySwap(drag.r, drag.c, drag.r + dr, drag.c + dc);
        }
      }
      if (released || !p.down) drag = null;
      // 太久沒動就提示一組可以消的
      if (phase === "idle") { hintT += dt; if (hintT > 6 && !hintMove) hintMove = findMove(board); } else hintT = 0;
    },
    draw(g) {
      const ctx = g.ctx;
      g.clear("#2a1d4a");
      if (state === "title") { drawTitle(g); return; }
      ctx.save();
      if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6 * shake * 3), Math.round((Math.random() - 0.5) * 6 * shake * 3));

      // 棋盤底
      g.rect(BX - 3, BY - 3, N * CELL + 6, N * CELL + 6, C.ink);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const x = BX + c * CELL, y = BY + r * CELL;
        g.rect(x, y, CELL, CELL, (r + c) % 2 ? "#4a3a78" : "#55448a");
        const ice = board.ice[r][c];
        if (ice) {
          g.rect(x + 1, y + 1, CELL - 2, CELL - 2, ice > 1 ? "#7fc8f0" : "#b8e4fa");
          g.rect(x + 2, y + 2, 4, 1, C.white); g.rect(x + 2, y + 3, 1, 3, C.white);
          if (ice > 1) { g.rect(x + CELL - 6, y + CELL - 4, 3, 1, "#3a88c0"); g.rect(x + 9, y + 6, 1, 5, "#3a88c0"); }
        }
      }
      // 選取框
      if (sel) { const x = BX + sel[1] * CELL, y = BY + sel[0] * CELL; g.rect(x, y, CELL, 1, C.yellow); g.rect(x, y + CELL - 1, CELL, 1, C.yellow); g.rect(x, y, 1, CELL, C.yellow); g.rect(x + CELL - 1, y, 1, CELL, C.yellow); }
      // 水果（畫在棋盤範圍內）
      ctx.save(); ctx.beginPath(); ctx.rect(BX - 2, BY - 2, N * CELL + 4, N * CELL + 4); ctx.clip();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (board.crate[r][c]) {
          g.draw(box, BX + c * CELL, BY + r * CELL);
          if (board.crate[r][c] > 1) { g.rect(BX + c * CELL + 3, BY + r * CELL + 3, 12, 2, "#5a6088"); g.rect(BX + c * CELL + 3, BY + r * CELL + 13, 12, 2, "#5a6088"); }
          continue;
        }
        const p = board.grid[r][c];
        if (!p) continue;
        let ox = 0, oy = 0;
        if (hintMove && Math.floor(t * 3) % 2 && ((hintMove[0] === r && hintMove[1] === c) || (hintMove[2] === r && hintMove[3] === c))) oy = -1;
        if (p.land) oy += 1;
        drawPiece(g, p, p.x + ox, p.y + oy, p.pop ? 1 + p.pop : 1);
        if (p.pop) p.pop = Math.max(0, p.pop - 1 / 60);
      }
      for (const d of dying) {
        const k = 1 - d.t / 0.18;
        drawPiece(g, d.p, d.x + 7 - 7 * k, d.y + 7 - 7 * k, k);
      }
      for (const b of beams) { ctx.globalAlpha = 1 - b.t / 0.3; g.rect(b.x, b.y, b.w, b.h, C.white); ctx.globalAlpha = 1; }
      ctx.restore();
      particles.forEach((q) => g.rect(q.x, q.y, 1, 1, q.c));
      pops.forEach((q) => g.text(q.text, q.x, q.y - Math.min(q.t, 0.4) * 20, q.c, { align: "center", shadow: C.ink, size: q.big ? 16 : 12 }));
      ctx.restore();

      drawHud(g);
      drawPanels(g);
    },
  };

  function drawPiece(g, p, x, y, s = 1) {
    const spr = p.sp === "rainbow" ? RAINBOW : FRUIT[p.t];
    const ctx = g.ctx;
    if (s !== 1) { const w = 14 * s; ctx.drawImage(spr, Math.round(x + 7 - w / 2), Math.round(y + 7 - w / 2), Math.round(w), Math.round(w)); }
    else g.draw(spr, x, y);
    if (s < 0.6) return;
    if (p.sp === "h") for (const yy of [4, 7, 10]) g.rect(x + 2, y + yy, 10, 1, "rgba(255,255,255,0.85)");
    if (p.sp === "v") for (const xx of [4, 7, 10]) g.rect(x + xx, y + 2, 1, 10, "rgba(255,255,255,0.85)");
    if (p.sp === "bomb") {
      const on = Math.floor(t * 6) % 2;
      g.rect(x - 1, y - 1, 16, 1, on ? C.white : C.yellow); g.rect(x - 1, y + 14, 16, 1, on ? C.white : C.yellow);
      g.rect(x - 1, y - 1, 1, 16, on ? C.white : C.yellow); g.rect(x + 14, y - 1, 1, 16, on ? C.white : C.yellow);
      g.rect(x + 6, y + 6, 2, 2, C.white);
    }
  }

  function drawHud(g) {
    g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.95)");
    g.text(`${lv + 1}. ${L.name}`, 2, -1, C.yellow);
    g.text("↺", RESTART.x + 6, -1, C.white, { align: "center" });
    g.text("≡", MENU.x + 6, -1, C.white, { align: "center" });
    // 步數
    g.rect(4, 15, 36, 40, C.ink); g.rect(5, 16, 34, 38, "#3a2a6a");
    g.text("步數", 22, 16, C.light, { align: "center" });
    g.text(String(moves), 22, 30, moves <= 3 ? C.red : C.white, { align: "center", size: 16 });
    // 目標
    const gs = goalStatus(board, L);
    g.rect(44, 15, 112, 26, C.ink); g.rect(45, 16, 110, 24, "#3a2a6a");
    let gx = 48;
    for (const part of gs.parts) {
      const ok = part.need ? part.have >= part.need : part.left === 0;
      if (part.t !== undefined) { g.draw(FRUIT[part.t], gx, 20); g.text(ok ? "✓" : String(part.need - part.have), gx + 16, 21, ok ? C.lime : C.white); gx += 34; }
      else if (part.ice) { g.rect(gx, 21, 12, 12, "#b8e4fa"); g.rect(gx + 1, 22, 3, 1, C.white); g.text(ok ? "✓" : String(part.left), gx + 15, 21, ok ? C.lime : C.white); gx += 34; }
      else if (part.crate) { g.draw(box, gx - 2, 19, false); g.text(ok ? "✓" : String(part.left), gx + 17, 21, ok ? C.lime : C.white); gx += 36; }
      else { g.text(`${Math.min(part.have, part.need)}/${part.need}`, gx, 21, ok ? C.lime : C.white); gx += 70; }
    }
    // 分數條和星星
    const s = board.score, max = L.stars[2];
    g.text(`${s}`, 48, 41, C.yellow);
    g.rect(80, 46, 74, 5, C.ink); g.rect(81, 47, Math.round(72 * Math.min(1, s / max)), 3, C.yellow);
    for (let k = 0; k < 3; k++) {
      const v = k === 0 ? (L.goal.score || L.stars[1] * 0.5) : L.stars[k];
      const sx = 81 + Math.round(72 * Math.min(1, v / max)) - 2;
      g.rect(sx, 44, 4, 4, s >= v ? C.yellow : C.gray);
    }
    if (state === "play") {
      const lines = lv === 0 && moves === L.moves ? ["按住水果往旁邊滑", "交換相鄰的兩個水果"] : L.tip.split("\n");
      lines.forEach((ln, i) => g.text(ln, W / 2, BY + N * CELL + 8 + i * 13, lv === 0 && moves === L.moves ? C.white : C.light, { align: "center" }));
    }
  }

  function drawPanels(g) {
    const panel = (y, h) => { g.rect(10, y, W - 20, h, C.white); g.rect(12, y + 2, W - 24, h - 4, C.navy); };
    const button = (r, label, col) => { g.rect(r.x, r.y, r.w, r.h, C.ink); g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, col); g.text(label, r.x + r.w / 2, r.y + (r.h - 13) / 2, C.ink, { align: "center" }); };
    if (state === "win" && phase === "done" && stateT > 0.4) {
      panel(100, 122);
      g.text("過關！", W / 2, 108, C.yellow, { align: "center", size: 16, shadow: C.ink });
      for (let k = 0; k < 3; k++) {
        const on = k < finalStars, x = W / 2 - 30 + k * 22, y = 132;
        g.text("★", x + 8, y, on ? C.yellow : C.gray, { align: "center", size: 16 });
      }
      g.text(`分數 ${board.score}`, W / 2, 154, C.white, { align: "center" });
      button(B1, lv < LEVELS.length - 1 ? "下一關" : "再玩", C.lime);
      button(B2, "重玩", C.yellow);
      button(B3, "選關", C.light);
      if (lv === LEVELS.length - 1) g.text("全部破關！", W / 2, 164, C.pink, { align: "center" });
    }
    if (state === "win" && phase !== "done") g.text(moves > 0 ? "剩餘步數獎勵！" : "", W / 2, BY - 2, C.yellow, { align: "center", shadow: C.ink });
    if (state === "lose" && stateT > 0.5) {
      panel(100, 122);
      g.text("步數用完了", W / 2, 108, C.red, { align: "center", size: 16, shadow: C.ink });
      const gs = goalStatus(board, L);
      const left = gs.parts.filter((p) => (p.need ? p.have < p.need : p.left > 0)).map((p) => (p.need ? `${p.label}差 ${p.need - p.have}` : `${p.label}剩 ${p.left}`));
      g.text(left.join("・"), W / 2, 130, C.white, { align: "center" });
      if (reward) {
        const st = reward.status;
        button(REVIVE, st === "ready" ? "▶ 看廣告 +5 步" : st === "none" ? "免費 +5 步（一次）" : st === "showing" ? "廣告播放中…" : "準備中…", st === "ready" || st === "none" ? C.lime : C.light);
      }
      button(B1, "重來", C.yellow);
      button(B2, "選關", C.light);
    }
  }

  function addMoves() {
    moves += 5; revived = true; reward = null;
    state = "play"; phase = "idle"; stateT = 10;
    pops.push({ x: W / 2, y: BY + 60, text: "+5 步！", c: C.lime, t: 0, big: true });
    PX.beep(523, 0.08); setTimeout(() => PX.beep(784, 0.12), 80);
  }

  function drawTitle(g) {
    g.text("芭樂", W / 2, 14, C.lime, { align: "center", size: 24, shadow: C.ink });
    g.text("消消樂", W / 2, 40, C.pink, { align: "center", size: 24, shadow: C.ink });
    g.text("GUAVA MATCH", W / 2, 68, C.white, { align: "center", shadow: C.ink });
    FRUIT.forEach((f, k) => g.draw(f, 18 + k * 21, 86 + (Math.floor(t * 3 + k) % 2)));
    LEVELS.forEach((d, i) => {
      const r = levelBtn(i), open = i < unlocked;
      g.rect(r.x, r.y, r.w, r.h, C.ink);
      g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, open ? [C.lime, C.yellow, "#a8e0ff", C.orange, C.pink][i] : C.gray);
      g.text(open ? `${i + 1}. ${d.name}` : `${i + 1}. ？？？`, r.x + 6, r.y + 1, open ? C.ink : C.light);
      if (open) for (let k = 0; k < 3; k++) g.text("★", r.x + 82 + k * 12, r.y + 1, k < starsGot[i] ? C.ink : "rgba(36,26,58,0.25)");
      g.text(open ? `${d.moves} 步・${goalText(d)}` : "破上一關解鎖", r.x + 6, r.y + 14, open ? C.navy : C.light);
    });
  }
  function goalText(d) {
    const g = d.goal, s = [];
    if (g.score) s.push(`${g.score} 分`);
    if (g.collect) s.push("收集");
    if (g.ice) s.push("冰塊");
    if (g.crate) s.push("木箱");
    return s.join("＋");
  }

  // 測試用：讓自動測試可以讀盤面、調步數
  window.GuavaMatchDebug = { get board() { return board; }, setMoves(n) { moves = n; }, findMove: () => findMove(board) };

  const canvas = document.getElementById("game");
  if (canvas) PX.run(canvas, game);
})();
