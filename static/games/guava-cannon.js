/* 芭樂砲手 Guava Cannon */
(() => {
  const { C } = PX;
  const W = 160, H = 256;
  const HUD_H = 12;

  // ── 物理參數 ──
  const GRAV = 220;        // 重力（px/s²）
  const V_MAX = 250;       // 力道 100% 的出手速度
  const AIM_FULL = 72;     // 手指離砲口多遠算滿力
  const BOOM_R = 13;       // 芭樂砲彈的爆炸半徑
  const NADE_R = 7;        // 蟲蛋的爆炸半徑
  const SUB = 4;           // 每幀拆成幾個小步驟算碰撞

  // ── 地形：0 空氣、1 木頭（可炸）、2 石頭（炸不壞） ──
  const AIR = 0, WOOD = 1, ROCK = 2;

  // 關卡用的小工具：R 長方形、O 圓形、P 多邊形；t = 0 代表挖空
  const R = (x, y, w, h, t = WOOD) => ({ k: "r", x, y, w, h, t });
  const O = (x, y, r, t = WOOD) => ({ k: "o", x, y, r, t });
  const P = (pts, t = WOOD) => ({ k: "p", pts, t });

  // ── 關卡 ──
  // player：腳底位置；enemies：x 和大概的高度（載入時會往下找地面）；boulders：巨石
  const LEVELS = [
    {
      name: "T 字塔", par: 1,
      hint: "炸巨石左邊\n把它推下去！",
      player: { x: 12, y: 200 },
      shapes: [R(0, 200, 24, 56, ROCK), R(24, 238, 136, 18), R(94, 112, 20, 126), R(64, 100, 88, 12)],
      enemies: [{ x: 138, y: 90 }],
      boulders: [{ x: 108, y: 88, r: 8 }],
    },
    {
      name: "兩層樓", par: 2,
      hint: "頭上有「!」的蟲兵\n會丟蟲蛋過來",
      player: { x: 12, y: 196 },
      shapes: [R(0, 196, 24, 60, ROCK), R(24, 226, 136, 30), R(66, 170, 36, 8), R(79, 178, 10, 48), R(116, 118, 44, 108)],
      enemies: [{ x: 84, y: 160 }, { x: 148, y: 100, armed: true }],
      boulders: [{ x: 126, y: 108, r: 7 }],
    },
    {
      name: "滾石坡", par: 1,
      hint: "炸掉擋住巨石的\n小木塊",
      player: { x: 11, y: 150 },
      shapes: [R(0, 150, 22, 106, ROCK), R(22, 238, 138, 18),
        P([[120, 72], [160, 64], [160, 238], [120, 238]]),
        P([[120, 76], [120, 238], [34, 238]]),
        R(121, 56, 6, 14), R(156, 24, 4, 42, ROCK)],
      enemies: [{ x: 100, y: 120 }, { x: 80, y: 160 }, { x: 60, y: 200 }],
      boulders: [{ x: 140, y: 52, r: 10 }],
    },
    {
      name: "石頭碉堡", par: 3,
      hint: "石頭炸不壞\n從旁邊的木牆打進去",
      player: { x: 12, y: 200 },
      shapes: [R(0, 200, 24, 56, ROCK), R(24, 236, 136, 20), R(92, 120, 68, 6, ROCK),
        R(92, 126, 8, 40), R(152, 126, 8, 40), R(92, 166, 68, 70)],
      enemies: [{ x: 112, y: 150 }, { x: 134, y: 150 }, { x: 126, y: 108, armed: true }],
      boulders: [],
    },
    {
      name: "斷橋", par: 2,
      hint: "把橋炸斷\n讓蟲兵掉下去",
      player: { x: 12, y: 170 },
      shapes: [R(0, 170, 24, 86, ROCK), R(24, 150, 14, 106), R(132, 150, 28, 106), R(38, 150, 94, 6)],
      enemies: [{ x: 58, y: 140 }, { x: 84, y: 140 }, { x: 112, y: 140, armed: true }],
      boulders: [{ x: 146, y: 140, r: 8 }],
    },
    {
      name: "雙石谷", par: 3,
      hint: "兩顆巨石\n都可以利用",
      player: { x: 10, y: 64 },
      shapes: [R(0, 64, 20, 192, ROCK), R(20, 222, 140, 34),
        P([[20, 124], [62, 124], [92, 222], [20, 222]]),
        P([[160, 108], [126, 108], [100, 222], [160, 222]])],
      enemies: [{ x: 78, y: 160 }, { x: 96, y: 200 }, { x: 112, y: 160, armed: true }],
      boulders: [{ x: 52, y: 110, r: 9 }, { x: 136, y: 94, r: 9 }],
    },
    {
      name: "反擊", par: 4,
      hint: "砲彈可以打掉\n飛過來的蟲蛋",
      player: { x: 12, y: 210 },
      shapes: [R(0, 210, 24, 46, ROCK), R(24, 232, 136, 24), O(78, 236, 18), R(120, 142, 30, 90), R(112, 136, 46, 6)],
      enemies: [{ x: 78, y: 200, armed: true }, { x: 146, y: 120, armed: true }, { x: 152, y: 220, armed: true }],
      boulders: [{ x: 122, y: 126, r: 8 }],
    },
    {
      name: "蟲王塔", par: 5,
      hint: "最後一關！\n先想好炸的順序",
      player: { x: 12, y: 204 },
      shapes: [R(0, 204, 24, 52, ROCK), R(24, 236, 136, 20), R(98, 64, 56, 172),
        R(102, 100, 48, 24, AIR), R(102, 150, 48, 24, AIR), R(98, 58, 56, 6, ROCK)],
      enemies: [{ x: 132, y: 40, armed: true }, { x: 112, y: 112 }, { x: 140, y: 112 }, { x: 126, y: 162, armed: true }],
      boulders: [{ x: 108, y: 46, r: 8 }, { x: 140, y: 162, r: 7 }],
    },
  ];

  // ── 世界：地形、敵人、巨石、砲彈（可整份複製，給模擬器用） ──
  const solidAt = (w, x, y) => {
    x |= 0; y |= 0;
    if (x < 0 || x >= W || y < 0 || y >= H) return false;
    return w.T[y * W + x] !== AIR;
  };

  function buildWorld(i) {
    const L = LEVELS[i];
    const T = new Uint8Array(W * H);
    const inPoly = (pts, x, y) => {
      let inside = false;
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
        const [xa, ya] = pts[a], [xb, yb] = pts[b];
        if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
      }
      return inside;
    };
    for (const s of L.shapes) {
      if (s.k === "r") {
        for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++)
          if (x >= 0 && x < W && y >= 0 && y < H) T[y * W + x] = s.t;
      } else if (s.k === "o") {
        for (let y = s.y - s.r; y <= s.y + s.r; y++) for (let x = s.x - s.r; x <= s.x + s.r; x++)
          if (x >= 0 && x < W && y >= 0 && y < H && (x - s.x) ** 2 + (y - s.y) ** 2 <= s.r * s.r) T[y * W + x] = s.t;
      } else {
        const xs = s.pts.map((p) => p[0]), ys = s.pts.map((p) => p[1]);
        for (let y = Math.min(...ys); y < Math.max(...ys); y++) for (let x = Math.min(...xs); x < Math.max(...xs); x++)
          if (inPoly(s.pts, x + 0.5, y + 0.5)) T[y * W + x] = s.t;
      }
    }
    const w = {
      T, level: i, enemies: [], boulders: [], bombs: [], nades: [], kos: [], events: [],
      player: { x: L.player.x, y: L.player.y }, hurt: 0,
    };
    for (const e of L.enemies) {
      let y = e.y;
      while (y < H && !solidAt(w, e.x, y)) y++;
      w.enemies.push({ x: e.x, y, vx: 0, vy: 0, armed: !!e.armed, dead: false, ground: true,
        cool: 4 + Math.random() * 3, wind: 0, flip: e.x > L.player.x });
    }
    for (const b of L.boulders) w.boulders.push({ x: b.x, y: b.y, r: b.r, vx: 0, vy: 0, rot: 0 });
    // 先讓巨石和蟲兵自己站穩
    for (let k = 0; k < 120; k++) step(w, 1 / 60, true);
    w.events.length = 0;
    w.boulders.forEach((b) => { b.vx = 0; b.vy = 0; });
    return w;
  }

  // ── 爆炸 ──
  function explode(w, x, y, r, from) {
    const r2 = r * r;
    let dug = 0;
    for (let yy = Math.floor(y - r); yy <= y + r; yy++) {
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        if ((xx - x) ** 2 + (yy - y) ** 2 > r2) continue;
        const k = yy * W + xx;
        if (w.T[k] === WOOD) { w.T[k] = AIR; dug++; }
      }
    }
    w.events.push({ type: "boom", x, y, r, dug, from });
    // 蟲兵：炸到直接打飛，附近的被震開
    for (const e of w.enemies) {
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - 4 - y, d = Math.hypot(dx, dy) || 1;
      if (d < r + 4) kill(w, e, (dx / d) * 120, -140 + (dy / d) * 60, from === "nade" ? "friendly" : "boom");
      else if (d < r * 2.4) {
        const k = 130 * (1 - d / (r * 2.4));
        e.vx += (dx / d) * k; e.vy += (dy / d) * k - k * 0.6; e.ground = false;
      }
    }
    // 巨石：被往外推
    for (const b of w.boulders) {
      const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy) || 1;
      const reach = r * 2.6 + b.r;
      if (d < reach) {
        const k = 95 * (1 - d / reach) * (8 / b.r);
        b.vx += (dx / d) * k; b.vy += (dy / d) * k - k * 0.3;
      }
    }
    // 附近的蟲蛋也一起引爆
    for (const n of w.nades) {
      if (!n.dead && Math.hypot(n.x - x, n.y - y) < r + 4) { n.dead = true; w.events.push({ type: "intercept", x: n.x, y: n.y }); }
    }
    // 玩家：只會被蟲蛋炸到
    if (from === "nade") {
      const d = Math.hypot(w.player.x - x, w.player.y - 6 - y);
      if (d < r + 3) w.events.push({ type: "hurt" });
    }
  }

  function kill(w, e, vx, vy, how) {
    e.dead = true;
    w.kos.push({ x: e.x, y: e.y - 4, vx, vy, spin: 0, t: 0, flip: e.flip });
    w.events.push({ type: "kill", x: e.x, y: e.y - 4, how });
  }

  // ── 物理一步 ──
  function step(w, dt, settling = false) {
    const h = dt / SUB;
    for (let s = 0; s < SUB; s++) {
      // 芭樂砲彈
      for (const b of w.bombs) {
        if (b.dead) continue;
        b.vy += GRAV * h; b.x += b.vx * h; b.y += b.vy * h;
        if (b.x < -30 || b.x > W + 30 || b.y > H + 20) { b.dead = true; w.events.push({ type: "miss" }); continue; }
        let hit = solidAt(w, b.x, b.y);
        if (!hit) hit = w.enemies.some((e) => !e.dead && Math.abs(e.x - b.x) < 5 && b.y > e.y - 10 && b.y < e.y + 1);
        if (!hit) hit = w.boulders.some((o) => Math.hypot(o.x - b.x, o.y - b.y) < o.r + 2);
        if (!hit) {
          const n = w.nades.find((n) => !n.dead && Math.hypot(n.x - b.x, n.y - b.y) < 6);
          if (n) { n.dead = true; hit = true; w.events.push({ type: "intercept", x: n.x, y: n.y }); }
        }
        if (hit) { b.dead = true; explode(w, b.x, b.y, BOOM_R, "bomb"); }
      }
      // 蟲蛋
      for (const n of w.nades) {
        if (n.dead) continue;
        n.vy += GRAV * h; n.x += n.vx * h; n.y += n.vy * h;
        if (n.x < -30 || n.x > W + 30 || n.y > H + 20) { n.dead = true; continue; }
        n.age += h;
        const hitPlayer = Math.abs(n.x - w.player.x) < 6 && n.y > w.player.y - 14 && n.y < w.player.y + 1;
        const hitBoulder = w.boulders.some((o) => Math.hypot(o.x - n.x, o.y - n.y) < o.r + 1);
        if (hitPlayer || hitBoulder || (n.age > 0.12 && solidAt(w, n.x, n.y))) { n.dead = true; explode(w, n.x, n.y, NADE_R, "nade"); }
      }
      // 巨石
      for (const b of w.boulders) boulderStep(w, b, h);
      for (let i = 0; i < w.boulders.length; i++) for (let j = i + 1; j < w.boulders.length; j++) {
        const a = w.boulders[i], c = w.boulders[j];
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1, o = a.r + c.r - d;
        if (o > 0) {
          const nx = dx / d, ny = dy / d;
          a.x -= nx * o / 2; a.y -= ny * o / 2; c.x += nx * o / 2; c.y += ny * o / 2;
          const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; c.vx -= rel * nx; c.vy -= rel * ny; }
        }
      }
      // 蟲兵
      for (const e of w.enemies) if (!e.dead) enemyStep(w, e, h, settling);
    }
    w.boulders = w.boulders.filter((b) => b.y < H + 30 && b.x > -30 && b.x < W + 30);
    w.bombs = w.bombs.filter((b) => !b.dead);
    w.nades = w.nades.filter((n) => !n.dead);
    for (const k of w.kos) { k.vy += GRAV * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.spin += dt * 12; k.t += dt; }
    w.kos = w.kos.filter((k) => k.t < 3 && k.y < H + 20);
  }

  const RING = Array.from({ length: 24 }, (_, i) => [Math.cos((i / 24) * Math.PI * 2), Math.sin((i / 24) * Math.PI * 2)]);
  function boulderStep(w, b, h) {
    b.vy += GRAV * h;
    b.x += b.vx * h; b.y += b.vy * h;
    let support = false;
    for (let iter = 0; iter < 4; iter++) {
      let nx = 0, ny = 0, hits = 0;
      for (const [cx, cy] of RING) {
        if (solidAt(w, b.x + cx * b.r, b.y + cy * b.r)) { nx -= cx; ny -= cy; hits++; }
        else if (solidAt(w, b.x + cx * b.r * 0.6, b.y + cy * b.r * 0.6)) { nx -= cx * 2; ny -= cy * 2; hits++; }
      }
      if (!hits) break;
      const d = Math.hypot(nx, ny);
      if (d < 0.01) { b.y -= 0.5; continue; }
      nx /= d; ny /= d;
      b.x += nx * 0.5; b.y += ny * 0.5;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= 1.15 * vn * nx; b.vy -= 1.15 * vn * ny;
        if (vn < -90) w.events.push({ type: "thud", x: b.x, y: b.y + b.r });
      }
      if (ny < -0.4) support = true;
    }
    if (support) { b.vx *= 1 - 0.6 * h; b.vy *= 1 - 0.6 * h; }
    b.rot += (b.vx * h) / b.r;
    // 滾動的巨石壓到蟲兵
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 14) {
      for (const e of w.enemies) {
        if (!e.dead && Math.hypot(e.x - b.x, e.y - 4 - b.y) < b.r + 4) kill(w, e, b.vx * 0.8, -90 + Math.min(0, b.vy), "rock");
      }
    }
  }

  function enemyStep(w, e, h, settling) {
    const footSolid = solidAt(w, e.x - 2, e.y) || solidAt(w, e.x, e.y) || solidAt(w, e.x + 2, e.y);
    if (footSolid && e.vy >= 0) {
      if (!e.ground && e.vy > 175 && !settling) { kill(w, e, e.vx, -60, "fall"); return; }
      e.ground = true; e.vy = 0; e.vx *= 1 - 8 * h;
      if (Math.abs(e.vx) < 2) e.vx = 0;
      // 被埋住就往上推
      let lift = 0;
      while (solidAt(w, e.x, e.y - 1) && lift < 3) { e.y--; lift++; }
    } else {
      e.ground = false;
      e.vy += GRAV * h;
    }
    const nx = e.x + e.vx * h;
    if (solidAt(w, nx + Math.sign(e.vx) * 3, e.y - 5)) e.vx = 0; else e.x = nx;
    const ny = e.y + e.vy * h;
    if (e.vy < 0 && solidAt(w, e.x, ny - 9)) e.vy = 0; else e.y = ny;
    if (!e.ground && e.vy > 0 && solidAt(w, e.x, e.y)) { while (solidAt(w, e.x, e.y - 1)) e.y--; }
    e.y = Math.min(e.y, H + 40);
    if (e.y > H + 8 || e.x < -10 || e.x > W + 10) kill(w, e, e.vx, 0, "fall");
  }

  function calm(w) {
    return !w.bombs.length && !w.nades.length &&
      w.boulders.every((b) => Math.hypot(b.vx, b.vy) < 6) &&
      w.enemies.every((e) => e.dead || (e.ground && Math.abs(e.vx) < 3));
  }

  const muzzle = (w) => ({ x: w.player.x + 1, y: w.player.y - 9 });
  function fire(w, angle, power) {
    const m = muzzle(w);
    const v = V_MAX * (0.25 + 0.75 * power);
    const a = (angle * Math.PI) / 180;
    w.bombs.push({ x: m.x + Math.cos(a) * 8, y: m.y - Math.sin(a) * 8, vx: Math.cos(a) * v, vy: -Math.sin(a) * v, dead: false });
  }

  // 給測試用：在背景跑完整的模擬（不畫圖）
  window.GuavaCannonSim = { LEVELS, buildWorld, step, fire, calm, W, H };

  // ═════════════════════════ 畫面 ═════════════════════════
  const maxColors = { H: "#16121f", S: C.peach, K: C.ink, R: C.pink, N: C.navy, G: "#4f7a6a", W: C.white };
  const maxSpr = PX.sprite([
    "..H.H.H...",
    ".HHHHHHH..",
    "HHHHHHHHH.",
    "HSSSSSSSH.",
    ".SKSSSKS..",
    ".SRSSSRS..",
    "..SSKKS...",
    ".NNNNNNN..",
    "SNNNNNNNS.",
    ".NNNNNNN..",
    ".GGGGGGG..",
    ".GG...GG..",
    ".WW...WW..",
  ], maxColors);
  const bugColors = { L: C.gray, M: C.light, K: C.ink, R: C.red, W: C.white };
  const bugSpr = PX.sprite([
    "..LLLLL..",
    ".LMLLLLL.",
    ".KRRRRRK.",
    "KRWKRWKRK",
    "KRRRRRRRK",
    ".KRRRRRK.",
    "..KKKKK..",
    ".K.K.K.K.",
    "K.......K",
  ], bugColors);
  const bugArmed = PX.sprite([
    "..LLLLL..",
    ".LMLLLLL.",
    ".KRRRRRK.",
    "KRWKRWKRK",
    "KRRRRRRRK",
    ".KRRRRRK.",
    "..KKKKK..",
    ".K.K.K.K.",
    ".K.....K.",
  ], bugColors);
  const bugKo = PX.sprite([
    "..LLLLL..",
    ".LMLLLLL.",
    ".KRRRRRK.",
    "KRKWRKWRK",
    "KRRRRRRRK",
    ".KRRKRRK.",
    "..KKKKK..",
    "..K...K..",
    ".........",
  ], bugColors);
  const guavaSpr = PX.sprite([
    "..G...",
    ".KKKK.",
    "KLLLLK",
    "KLPPLK",
    "KLPPLK",
    ".KKKK.",
  ], { K: C.ink, L: C.lime, P: C.pink, G: C.green });
  const eggSpr = PX.sprite([
    ".KK.",
    "KBBK",
    "KBWK",
    ".KK.",
  ], { K: C.ink, B: C.brown, W: C.peach });
  const heart = PX.sprite([".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."], { R: C.red });
  const heartEmpty = PX.sprite([".KK.KK.", "K..K..K", "K.....K", ".K...K.", "..K.K..", "...K..."], { K: C.gray });
  const starOn = PX.sprite(["....Y....", "...YYY...", "YYYYYYYYY", ".YYYYYYY.", "..YYYYY..", ".YYY.YYY.", "YY.....YY"], { Y: C.yellow });
  const starOff = PX.sprite(["....K....", "...KKK...", "KKKKKKKKK", ".KKKKKKK.", "..KKKKK..", ".KKK.KKK.", "KK.....KK"], { K: C.gray });

  // 巨石的像素圖（依半徑快取）
  const rockCache = {};
  function rockSpr(r) {
    if (rockCache[r]) return rockCache[r];
    const c = document.createElement("canvas");
    c.width = c.height = r * 2 + 1;
    const x = c.getContext("2d");
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i, j);
      if (d > r + 0.3) continue;
      const shade = (-i - j) / (r * 2);
      x.fillStyle = d > r - 1 ? C.ink : shade > 0.35 ? "#b8bcd8" : shade > -0.1 ? "#8088b0" : "#5a6088";
      x.fillRect(i + r, j + r, 1, 1);
    }
    return (rockCache[r] = c);
  }

  // 背景：天空、雲、遠山（每關畫一次）
  const bg = document.createElement("canvas");
  bg.width = W; bg.height = H;
  let bgSeed = -1;
  function paintBackground(seed) {
    if (bgSeed === seed) return;
    bgSeed = seed;
    const x = bg.getContext("2d");
    const bands = ["#5fb8f0", "#74c4f4", "#8ad0f6", "#a0daf8", "#b8e4fa"];
    bands.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * 34, W, 34); });
    x.fillStyle = "#c8ecfa"; x.fillRect(0, 170, W, H - 170);
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    // 雲
    x.fillStyle = C.white;
    for (let k = 0; k < 4; k++) {
      const cx = rnd() * W, cy = 24 + rnd() * 90, n = 3 + Math.floor(rnd() * 3);
      for (let j = 0; j < n; j++) {
        const rr = 6 + rnd() * 8, ox = (j - n / 2) * 9;
        for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++)
          if (xx * xx + yy * yy <= rr * rr && yy < rr * 0.6) x.fillRect(Math.round(cx + ox + xx), Math.round(cy + yy), 1, 1);
      }
    }
    // 遠山兩層
    const hills = (base, amp, col, f) => {
      x.fillStyle = col;
      for (let i = 0; i < W; i++) {
        const y = Math.round(base + Math.sin(i * f + seed) * amp + Math.sin(i * f * 2.7 + seed * 3) * amp * 0.4);
        x.fillRect(i, y, 1, H - y);
      }
    };
    hills(178, 8, "#8cc8a0", 0.05);
    hills(198, 6, "#5aa878", 0.08);
    // 小河
    x.fillStyle = "#7ec8e8";
    for (let i = 0; i < W; i++) x.fillRect(i, Math.round(214 + Math.sin(i * 0.07 + seed) * 4), 1, 2);
  }

  // 地形圖層
  const terr = document.createElement("canvas");
  terr.width = W; terr.height = H;
  const tctx = terr.getContext("2d");
  const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const WOOD_TOP = hexRGB("#f8d898"), WOOD_A = hexRGB("#e8b068"), WOOD_B = hexRGB("#d89a54"),
    WOOD_LINE = hexRGB("#a8683a"), WOOD_EDGE = hexRGB("#6a3c22"),
    ROCK_A = hexRGB("#8a8ca0"), ROCK_B = hexRGB("#6e7088"), ROCK_TOP = hexRGB("#b8bacc"), ROCK_EDGE = hexRGB("#3c3e54");
  function paintTerrain(w) {
    const img = tctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = w.T[y * W + x];
      if (!t) continue;
      const up = y > 0 ? w.T[(y - 1) * W + x] : 0;
      const edge = (x > 0 && !w.T[y * W + x - 1]) || (x < W - 1 && !w.T[y * W + x + 1]) || (y < H - 1 && !w.T[(y + 1) * W + x]);
      let c;
      if (t === WOOD) {
        if (!up) c = WOOD_TOP;
        else if (edge) c = WOOD_EDGE;
        else if (y % 8 === 0 || (x + ((y >> 3) & 1) * 10) % 20 === 0) c = WOOD_LINE;
        else c = ((x * 7 + (y >> 3) * 13) % 11 < 5) ? WOOD_A : WOOD_B;
      } else {
        if (!up) c = ROCK_TOP;
        else if (edge) c = ROCK_EDGE;
        else c = ((x * 31 + y * 17) % 7 < 2) ? ROCK_B : ROCK_A;
      }
      const k = (y * W + x) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
  }

  // ── 遊戲狀態 ──
  const SAVE = "guava-cannon";
  let state = "title";          // title / play / clear / over
  let stateT = 0, t = 0;
  let world = null, levelIdx = 0;
  let shots = 0, hearts = 3, invuln = 0, reload = 0;
  let aim = { angle: 45, power: 0.6 };
  let aiming = false, wasDown = false, aimTouched = false;
  let shake = 0, calmT = 0, clearStars = 0;
  let keyHold = 0, keyAim = 0;
  let particles = [], pops = [], booms = [];
  let unlocked = Math.max(1, PX.best(SAVE + "-unlocked"));
  const stars = LEVELS.map((_, i) => PX.best(`${SAVE}-stars-${i}`));
  let tutorial = true;

  function startLevel(i) {
    levelIdx = i;
    world = buildWorld(i);
    shots = 0; hearts = 3; invuln = 0; reload = 0;
    aim = { angle: world.player.x < W / 2 ? 50 : 130, power: 0.6 };
    particles = []; pops = []; booms = []; calmT = 0; shake = 0;
    paintBackground(i + 1);
    paintTerrain(world);
    state = "play"; stateT = 0;
  }

  // 依角度和力道算出預覽軌跡
  function trajectory() {
    const m = muzzle(world);
    const v = V_MAX * (0.25 + 0.75 * aim.power);
    const a = (aim.angle * Math.PI) / 180;
    let x = m.x + Math.cos(a) * 8, y = m.y - Math.sin(a) * 8, vx = Math.cos(a) * v, vy = -Math.sin(a) * v;
    const pts = [];
    for (let i = 0; i < 70; i++) {
      for (let k = 0; k < 3; k++) { vy += GRAV / 180; x += vx / 180; y += vy / 180; }
      if (solidAt(world, x, y) || y > H || x < -5 || x > W + 5) break;
      if (i % 2 === 0) pts.push([x, y]);
    }
    return pts;
  }

  // ── 按鈕 ──
  const BTN_RESTART = { x: W - 24, y: 0, w: 12, h: HUD_H };
  const BTN_MENU = { x: W - 12, y: 0, w: 12, h: HUD_H };
  const inRect = (p, r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
  const levelCell = (i) => ({ x: 14 + (i % 4) * 34, y: 132 + Math.floor(i / 4) * 38, w: 30, h: 32 });
  const panelBtns = {
    next: { x: 24, y: 160, w: 52, h: 18 }, retry: { x: 84, y: 160, w: 52, h: 18 },
    menu: { x: 54, y: 184, w: 52, h: 16 },
    again: { x: 46, y: 158, w: 68, h: 18 },
  };

  function addParticles(x, y, n, colors, speed = 80) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: 0.5 + Math.random() * 0.5,
        c: colors[(Math.random() * colors.length) | 0] });
    }
  }

  function handleEvents() {
    for (const ev of world.events) {
      if (ev.type === "boom") {
        booms.push({ x: ev.x, y: ev.y, r: ev.r, t: 0 });
        shake = Math.max(shake, ev.from === "bomb" ? 0.25 : 0.12);
        addParticles(ev.x, ev.y, Math.min(24, 6 + ev.dug / 12), ["#e8b068", "#a8683a", "#f8d898", C.white], 90);
        PX.beep(ev.from === "bomb" ? 110 : 160, 0.25, "sawtooth", 0.07, -80);
        paintTerrain(world);
      } else if (ev.type === "kill") {
        const words = { rock: "壓扁！", fall: "掉下去！", boom: "命中！", friendly: "自爆！" };
        pops.push({ x: ev.x, y: ev.y - 10, text: words[ev.how] || "KO!", t: 0, c: ev.how === "rock" ? C.yellow : C.white });
        addParticles(ev.x, ev.y, 8, [C.red, C.yellow, C.white], 70);
        PX.beep(660, 0.08); PX.beep(880, 0.1, "square", 0.05);
      } else if (ev.type === "intercept") {
        pops.push({ x: ev.x, y: ev.y - 8, text: "攔截！", t: 0, c: C.lime });
        PX.beep(990, 0.1, "square", 0.05);
      } else if (ev.type === "hurt") {
        if (invuln <= 0 && state === "play") {
          hearts--; invuln = 1.2; shake = 0.35;
          PX.beep(140, 0.3, "square", 0.08, -60);
          if (hearts <= 0) { state = "over"; stateT = 0; }
        }
      } else if (ev.type === "thud") {
        PX.beep(80, 0.06, "triangle", 0.06);
      }
    }
    world.events.length = 0;
  }

  // 蟲兵丟蟲蛋
  function enemyAI(dt) {
    for (const e of world.enemies) {
      if (e.dead || !e.armed || !e.ground) continue;
      if (e.wind > 0) {
        e.wind -= dt;
        if (e.wind <= 0) {
          const sx = e.x, sy = e.y - 10;
          const tx = world.player.x, ty = world.player.y - 6;
          const T = 1.25 + Math.random() * 0.35;
          const err = 1 + (Math.random() - 0.5) * 0.4;
          world.nades.push({ x: sx, y: sy, vx: ((tx - sx) / T) * err, vy: (ty - sy) / T - 0.5 * GRAV * T, dead: false, age: 0 });
          e.cool = 5.5 + Math.random() * 3;
          PX.beep(330, 0.06, "triangle", 0.05, 120);
        }
        continue;
      }
      e.cool -= dt;
      // 同一時間只有一隻蟲兵在丟，避免同時飛來好幾顆
      if (e.cool <= 0 && !world.nades.length && !world.enemies.some((o) => o.wind > 0)) e.wind = 0.8;
    }
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
        if (tap) {
          for (let i = 0; i < LEVELS.length; i++) {
            if (i < unlocked && inRect(p, levelCell(i))) { startLevel(i); PX.beep(523, 0.08); PX.beep(784, 0.12); return; }
          }
        }
        if (api.hit(" ", "Enter")) startLevel(Math.min(unlocked, LEVELS.length) - 1);
        return;
      }

      if (state === "clear" || state === "over") {
        if (world) { step(world, dt); handleEvents(); }
        updateFx(dt);
        if (stateT < 0.6) return;
        const hasNext = state === "clear" && levelIdx < LEVELS.length - 1;
        if (tap) {
          if (hasNext && inRect(p, panelBtns.next)) startLevel(levelIdx + 1);
          else if (inRect(p, state === "clear" ? panelBtns.retry : panelBtns.again) || (state === "clear" && !hasNext && inRect(p, panelBtns.next))) startLevel(levelIdx);
          else if (inRect(p, panelBtns.menu)) { state = "title"; stateT = 0; }
        }
        if (api.hit(" ", "Enter")) startLevel(hasNext ? levelIdx + 1 : levelIdx);
        return;
      }

      // ── 遊玩中 ──
      if (tap && inRect(p, BTN_RESTART)) { startLevel(levelIdx); return; }
      if (tap && inRect(p, BTN_MENU)) { state = "title"; stateT = 0; return; }

      reload -= dt; invuln -= dt;
      // 砲彈無限：只要還有愛心就能一直打
      const canFire = reload <= 0 && !world.bombs.length;

      // 觸控／滑鼠：按住往想打的方向拖，放開發射
      if (tap && p.y > HUD_H) aiming = true;
      if (aiming && p.down) {
        const m = muzzle(world);
        const dx = p.x - m.x, dy = m.y - p.y;
        const dist = Math.hypot(dx, dy);
        aimTouched = dist > 10;
        if (aimTouched) {
          aim.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          aim.power = Math.max(0, Math.min(1, (dist - 10) / AIM_FULL));
        }
      }
      if (aiming && released) {
        aiming = false;
        if (aimTouched && canFire) shoot();
      }
      // 鍵盤
      // 鍵盤：← → 轉砲管（點一下 1 度，按住先慢後快）、↑ ↓ 調力道
      const turn = (api.key("ArrowLeft") ? 1 : 0) - (api.key("ArrowRight") ? 1 : 0);
      const pw = (api.key("ArrowUp") ? 1 : 0) - (api.key("ArrowDown") ? 1 : 0);
      if (turn || pw) { keyHold += dt; keyAim = 2; } else keyHold = 0;
      if (api.hit("ArrowLeft")) aim.angle += 1;
      if (api.hit("ArrowRight")) aim.angle -= 1;
      if (api.hit("ArrowUp")) aim.power = Math.min(1, aim.power + 0.01);
      if (api.hit("ArrowDown")) aim.power = Math.max(0, aim.power - 0.01);
      if (keyHold > 0.25) {
        const fast = keyHold > 1 ? 1 : 0.35;
        aim.angle += turn * 50 * fast * dt;
        aim.power = Math.max(0, Math.min(1, aim.power + pw * 0.45 * fast * dt));
      }
      if (aim.angle > 180) aim.angle -= 360;
      if (aim.angle < -180) aim.angle += 360;
      keyAim -= dt;
      if (api.hit(" ", "Enter") && canFire) shoot();
      if (api.hit("r")) { startLevel(levelIdx); return; }

      enemyAI(dt);
      step(world, dt);
      handleEvents();
      updateFx(dt);
      if (state !== "play") return;

      const alive = world.enemies.filter((e) => !e.dead).length;
      if (!alive) {
        calmT += dt;
        if (calmT > 0.7) {
          clearStars = shots <= LEVELS[levelIdx].par ? 3 : shots <= LEVELS[levelIdx].par + 1 ? 2 : 1;
          if (clearStars > stars[levelIdx]) { stars[levelIdx] = clearStars; PX.best(`${SAVE}-stars-${levelIdx}`, clearStars); }
          if (levelIdx + 2 > unlocked) { unlocked = Math.min(LEVELS.length, levelIdx + 2); PX.best(SAVE + "-unlocked", unlocked); }
          state = "clear"; stateT = 0;
          PX.beep(523, 0.1); setTimeout(() => PX.beep(659, 0.1), 100); setTimeout(() => PX.beep(784, 0.18), 200);
        }
      } else calmT = 0;
    },
    draw(g) {
      const ctx = g.ctx;
      if (state === "title") { drawTitle(g); return; }
      ctx.save();
      if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4 * shake * 4), Math.round((Math.random() - 0.5) * 4 * shake * 4));
      ctx.drawImage(bg, 0, 0);
      ctx.drawImage(terr, 0, 0);

      // 巨石
      for (const b of world.boulders) {
        g.draw(rockSpr(b.r), b.x - b.r, b.y - b.r);
        for (const k of [0, 2.1, 4.2]) g.rect(b.x + Math.cos(b.rot + k) * b.r * 0.5, b.y + Math.sin(b.rot + k) * b.r * 0.5, 1, 1, "#3c3e54");
      }
      // 蟲兵
      for (const e of world.enemies) {
        if (e.dead) continue;
        const bob = e.ground ? Math.floor(t * 3 + e.x) % 2 : 0;
        g.draw(e.wind > 0 ? bugArmed : bugSpr, e.x - 4, e.y - 9 - bob, !e.flip);
        if (e.armed) {
          if (e.wind > 0) g.draw(eggSpr, e.x - 2, e.y - 15 - bob);
          else g.text("!", e.x, e.y - 22, C.red, { align: "center", shadow: C.ink });
        }
      }
      for (const k of world.kos) {
        ctx.save(); ctx.translate(Math.round(k.x), Math.round(k.y)); ctx.rotate(k.spin);
        ctx.drawImage(bugKo, -4, -4); ctx.restore();
      }
      // 玩家和砲管
      const pl = world.player;
      const blink = invuln > 0 && Math.floor(t * 12) % 2;
      if (!blink) {
        g.draw(maxSpr, pl.x - 5, pl.y - 13, pl.x > W / 2);
        drawTube(g, aim.angle);
      }
      // 瞄準軌跡
      // 準備好可以發射時一直顯示虛線；正在調整時變亮，並顯示力道條和角度
      if (state === "play" && !world.bombs.length) {
        const active = aiming || keyAim > 0;
        const pts = trajectory();
        pts.forEach(([x, y], i) => g.rect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, active ? C.white : "rgba(255,241,232,0.55)"));
        if (active) {
          const deg = Math.round(pl.x > W / 2 ? 180 - aim.angle : aim.angle);
          g.text(`${deg}°  ${Math.round(aim.power * 100)}%`, pl.x + (pl.x > W / 2 ? -14 : 14), pl.y - 30, C.white,
            { align: pl.x > W / 2 ? "right" : "left", shadow: C.ink });
          const m = muzzle(world);
          g.rect(m.x - 12 * (pl.x > W / 2 ? -1 : 1) - 1, pl.y - 26, 3, 22, C.ink);
          const ph = Math.round(20 * aim.power);
          g.rect(m.x - 12 * (pl.x > W / 2 ? -1 : 1), pl.y - 5 - ph, 1, ph, aim.power > 0.9 ? C.red : C.yellow);
        }
      }
      // 砲彈與蟲蛋
      for (const b of world.bombs) g.draw(guavaSpr, b.x - 3, b.y - 3);
      for (const n of world.nades) g.draw(eggSpr, n.x - 2, n.y - 2);
      // 爆炸
      for (const b of booms) {
        const k = b.t / 0.35, rr = b.r * (0.6 + k * 0.7);
        ctx.fillStyle = k < 0.3 ? C.white : k < 0.6 ? C.yellow : C.orange;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath(); ctx.arc(Math.round(b.x), Math.round(b.y), rr, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      particles.forEach((q) => g.rect(q.x, q.y, 1, 1, q.c));
      pops.forEach((q) => g.text(q.text, q.x, q.y - q.t * 14, q.c, { align: "center", shadow: C.ink }));
      ctx.restore();

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.9)");
      g.text(`${levelIdx + 1}. ${LEVELS[levelIdx].name}`, 2, -1, C.yellow);
      for (let i = 0; i < 3; i++) g.draw(i < hearts ? heart : heartEmpty, 76 + i * 8, 3);
      // 已經用了幾發（超過三星門檻會變紅）
      g.draw(guavaSpr, 104, 3);
      g.text(`${shots}/${LEVELS[levelIdx].par}`, 112, -1, shots > LEVELS[levelIdx].par ? C.red : C.white);
      g.text("↺", BTN_RESTART.x + 6, -1, C.white, { align: "center" });
      g.text("≡", BTN_MENU.x + 6, -1, C.white, { align: "center" });

      if (state === "play" && tutorial && stateT < 6) {
        const lines = LEVELS[levelIdx].hint.split("\n");
        lines.forEach((ln, i) => g.text(ln, W / 2, HUD_H + 3 + i * 13, C.white, { align: "center", shadow: C.ink }));
        if (levelIdx === 0 && shots === 0) g.text("按住拖曳瞄準，放開發射", W / 2, HUD_H + 5 + lines.length * 13, C.yellow, { align: "center", shadow: C.ink });
      }
      if (invuln > 0.9) g.rect(0, 0, W, H, "rgba(255,0,77,0.18)");

      // 結算畫面
      const panel = (y, h) => { g.rect(8, y, W - 16, h, C.white); g.rect(10, y + 2, W - 20, h - 4, C.navy); };
      const button = (r, label, col = C.yellow) => {
        g.rect(r.x, r.y, r.w, r.h, C.ink); g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, col);
        g.text(label, r.x + r.w / 2, r.y + (r.h - 14) / 2, C.ink, { align: "center" });
      };
      if (state === "clear") {
        panel(84, 124);
        g.text("STAGE CLEAR!", W / 2, 92, C.yellow, { align: "center", size: 16, shadow: C.ink });
        for (let i = 0; i < 3; i++) g.draw(i < clearStars ? starOn : starOff, W / 2 - 31 + i * 22, 112, false, 2);
        g.text(`用了 ${shots} 發・三星 ≤ ${LEVELS[levelIdx].par} 發`, W / 2, 132, C.white, { align: "center" });
        if (stateT > 0.6) {
          const hasNext = levelIdx < LEVELS.length - 1;
          button(panelBtns.next, hasNext ? "下一關" : "再玩", C.lime);
          button(panelBtns.retry, "重玩", C.yellow);
          button(panelBtns.menu, "選關", C.light);
          if (!hasNext) g.text("全部破關！", W / 2, 146, C.pink, { align: "center" });
        }
      }
      if (state === "over") {
        panel(92, 116);
        g.text("被打倒了", W / 2, 102, C.red, { align: "center", size: 16, shadow: C.ink });
        g.text("小心飛過來的蟲蛋", W / 2, 126, C.white, { align: "center" });
        g.text(`還剩 ${world.enemies.filter((e) => !e.dead).length} 隻蟲兵`, W / 2, 140, C.light, { align: "center" });
        if (stateT > 0.6) {
          button(panelBtns.again, "再試一次", C.yellow);
          button(panelBtns.menu, "選關", C.light);
        }
      }
    },
  };

  function shoot() {
    fire(world, aim.angle, aim.power);
    shots++; reload = 0.35;
    if (shots === 1) tutorial = false;
    PX.beep(220, 0.12, "square", 0.07, 260);
    const m = muzzle(world);
    addParticles(m.x, m.y, 5, [C.white, C.light], 40);
  }

  function updateFx(dt) {
    shake = Math.max(0, shake - dt);
    for (const q of particles) { q.vy += GRAV * 0.6 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.t += dt; }
    particles = particles.filter((q) => q.t < q.life);
    pops.forEach((q) => { q.t += dt; });
    pops = pops.filter((q) => q.t < 1);
    booms.forEach((b) => { b.t += dt; });
    booms = booms.filter((b) => b.t < 0.35);
  }

  // 砲管：沿著瞄準方向畫一條 3 格粗的線
  function drawTube(g, angle) {
    const m = muzzle(world);
    const a = (angle * Math.PI) / 180, cx = Math.cos(a), cy = -Math.sin(a);
    for (let i = -2; i <= 8; i++) {
      const x = Math.round(m.x + cx * i), y = Math.round(m.y + cy * i);
      g.rect(x - 1, y - 1, 3, 3, i >= 7 ? C.ink : i < 0 ? C.green : C.lime);
    }
  }

  function drawTitle(g) {
    paintBackground(99);
    g.ctx.drawImage(bg, 0, 0);
    g.rect(0, 220, W, 36, "#d89a54");
    g.rect(0, 220, W, 2, "#f8d898");
    g.draw(maxSpr, 20, 207);
    drawTitleTube(g);
    g.draw(rockSpr(10), 120, 200);
    g.draw(bugSpr, 136, 211, true);
    g.text("芭樂砲手", W / 2, 28, C.pink, { align: "center", size: 24, shadow: C.ink });
    g.text("GUAVA CANNON", W / 2, 56, C.white, { align: "center", shadow: C.ink });
    g.text("拖曳瞄準，把蟲兵炸飛！", W / 2, 80, C.ink, { align: "center" });
    g.text("炸地形、推巨石壓扁牠們", W / 2, 94, C.ink, { align: "center" });
    g.text("選擇關卡", W / 2, 114, C.navy, { align: "center" });
    for (let i = 0; i < LEVELS.length; i++) {
      const r = levelCell(i), open = i < unlocked;
      g.rect(r.x, r.y, r.w, r.h, C.ink);
      g.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, open ? C.yellow : C.gray);
      g.text(open ? String(i + 1) : "鎖", r.x + r.w / 2, r.y + 2, open ? C.ink : C.light, { align: "center", size: 12 });
      if (open) for (let s = 0; s < 3; s++) g.rect(r.x + 6 + s * 7, r.y + 22, 4, 4, s < stars[i] ? C.orange : C.light);
    }
  }
  function drawTitleTube(g) {
    const a = 0.7;
    for (let i = -2; i <= 8; i++) {
      const x = Math.round(26 + Math.cos(a) * i), y = Math.round(211 - Math.sin(a) * i);
      g.rect(x - 1, y - 1, 3, 3, i >= 7 ? C.ink : C.lime);
    }
  }

  const canvas = document.getElementById("game");
  if (canvas) PX.run(canvas, game);
})();
