/* 芭樂吐籽大作戰 Guava Seed Rush */
(() => {
  const { C } = PX;
  const W = 160, H = 256;

  // ── 版面 ──
  const HUD_H = 12;
  const GROUND_Y = 66;          // 戰場地面（蟲的腳底）
  const DIRT_Y = 68;            // 戰場與地底的分界
  const FIELD_L = 11, FIELD_R = 156;
  const CX = Math.round((FIELD_L + FIELD_R) / 2);
  const SPIT_Y = 74;            // 吐籽芭樂的頂端
  const MOUTH_Y = 96;
  const ROWS = [122, 152, 182]; // 閘門的三排高度
  const FUNNEL_TOP = 206;
  const FUNNEL_BOTTOM = 226;
  const HOLE = 8;               // 漏斗開口半寬
  const PIPE_Y = 242;
  const HERO_X = 14;
  const SEED_CAP = 220;

  // ── 像素圖 ──
  const guavaColors = { G: C.lime, K: C.ink, D: C.green, P: C.pink, W: C.white, L: C.peach };
  const spitter = PX.sprite([
    "......GG......",
    ".....GG.......",
    "...KKKKKKKK...",
    "..KDDDDDDDDK..",
    ".KDPPPPPPPPDK.",
    "KDPPWKPPWKPPDK",
    "KDPPKKPPKKPPDK",
    "KDPLPPPPPPLPDK",
    "KDPPPPPPPPPPDK",
    ".KDPPPPPPPPDK.",
    "..KDDDDDDDDK..",
    "...KKKKKKKK...",
  ], guavaColors);
  const spitterOpen = PX.sprite([
    "......GG......",
    ".....GG.......",
    "...KKKKKKKK...",
    "..KDDDDDDDDK..",
    ".KDPPPPPPPPDK.",
    "KDPPWKPPWKPPDK",
    "KDPPKKPPKKPPDK",
    "KDPLPPPPPPLPDK",
    "KDPPPPKKPPPPDK",
    ".KDPPPKKPPPDK.",
    "..KDDDDDDDDK..",
    "...KKKKKKKK...",
  ], guavaColors);

  const hero = PX.sprite([
    "....RRRR....",
    "...RKKKKR...",
    "..KDDDDDDK..",
    ".KDPPPPPPDK.",
    ".KDPWKPWKDK.",
    ".KDPPPPPPDKO",
    ".KDPPKKPPDO.",
    "..KDPPPPDKO.",
    "...KKKKKK...",
    "....K..K....",
    "...KK..KK...",
  ], { R: C.red, K: C.ink, D: C.green, P: C.pink, W: C.white, O: C.brown });

  const bugA = PX.sprite([
    "..K..K..",
    "...KK...",
    ".KRRRRK.",
    "KRRKKRRK",
    "KRRKKRRK",
    ".KRRRRK.",
    "K.KKKK.K",
    "K......K",
  ], { K: C.ink, R: C.red });
  const bugB = PX.sprite([
    "K.K..K..",
    "...KK...",
    ".KRRRRK.",
    "KRRKKRRK",
    "KRRKKRRK",
    ".KRRRRK.",
    ".KKKKKK.",
    "K......K",
  ], { K: C.ink, R: C.red });
  const boss = PX.sprite([
    "..K..K..",
    "...KK...",
    ".KOOOOK.",
    "KOOKKOOK",
    "KOOKKOOK",
    ".KOOOOK.",
    "K.KKKK.K",
    "K......K",
  ], { K: C.ink, O: C.plum });

  const heart = PX.sprite([".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."], { R: C.red });
  const heartEmpty = PX.sprite([".KK.KK.", "K..K..K", "K.....K", ".K...K.", "..K.K..", "...K..."], { K: C.lavender });
  const lock = PX.sprite(["..KK..", ".K..K.", ".K..K.", "KKKKKK", "KK..KK", "KKKKKK"], { K: C.white });

  // 背景裝飾（固定位置）
  const specks = Array.from({ length: 70 }, (_, i) => ({
    x: FIELD_L + ((i * 37) % (FIELD_R - FIELD_L)),
    y: DIRT_Y + 8 + ((i * 53) % (FUNNEL_TOP - DIRT_Y)),
  }));
  const stars = Array.from({ length: 18 }, (_, i) => ({ x: (i * 41) % W, y: HUD_H + 3 + ((i * 17) % 34) }));

  // ── 遊戲狀態 ──
  let state, t, stateT, best, newRecord;
  let wave, hearts, score, ammo, collected, kills;
  let guava, seeds, gates, flows, bugs, bullets, pops, shake;
  let spawnLeft, spawnT, fireT, spitT, waveStartCollected, hurtFlash, lastPointerX;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pop = (x, y, text, color, life = 0.8) => pops.push({ x, y, text, color, life });

  const funnelY = (x) => {
    if (x < CX) return FUNNEL_TOP + ((x - FIELD_L) / (CX - HOLE - FIELD_L)) * (FUNNEL_BOTTOM - FUNNEL_TOP);
    return FUNNEL_TOP + ((FIELD_R - x) / (FIELD_R - CX - HOLE)) * (FUNNEL_BOTTOM - FUNNEL_TOP);
  };

  // 每一波重新產生閘門配置
  const buildGates = () => {
    gates = [];
    let id = 0;
    const lockedRow = wave >= 2 ? Math.floor(Math.random() * 2) : -1;
    const movingRow = wave >= 2 ? 2 : -1;
    ROWS.forEach((y, r) => {
      const two = r !== movingRow && (wave >= 2 || r === 1) && Math.random() < 0.75;
      const slots = two ? [[FIELD_L + 4, CX - 6], [CX + 6, FIELD_R - 4]] : [[FIELD_L + 4, FIELD_R - 4]];
      slots.forEach(([a, b], s) => {
        const w = Math.round(Math.min(b - a, rand(34, 50)));
        const x = Math.round(rand(a, b - w));
        const gate = { id: id++, x, baseX: x, y, w, mult: pick([2, 2, 3, 3, 3]), type: "mult", amp: 0, phase: rand(0, 6) };
        if (r === lockedRow && s === 0) {
          gate.type = "locked";
          gate.mult = wave >= 6 ? 10 : 8;
          gate.need = waveStartCollected + 80 + wave * 40;
        } else if (wave >= 3 && Math.random() < 0.22) {
          gate.type = "half";
        } else if (r === movingRow) {
          gate.mult = 5;
          gate.w = 22;
          gate.amp = (FIELD_R - FIELD_L - 22) / 2 - 4;
          gate.baseX = CX - 11;
          gate.x = gate.baseX;
        }
        gates.push(gate);
      });
    });
  };

  const startWave = () => {
    const isBossWave = wave % 5 === 0;
    spawnLeft = isBossWave ? 3 + Math.floor(wave / 2) : Math.round(4 + wave * 1.5);
    spawnT = 1.2;
    waveStartCollected = collected;
    buildGates();
    if (isBossWave) pop(W / 2, 28, "BOSS 來襲！", C.orange, 1.6);
  };

  const reset = () => {
    t = 0; stateT = 0; newRecord = false;
    wave = 1; hearts = 3; score = 0; ammo = 0; collected = 0; kills = 0;
    guava = { x: CX, vx: 0 };
    seeds = []; flows = []; bugs = []; bullets = []; pops = [];
    shake = 0; fireT = 0; spitT = 0; hurtFlash = 0; waveStartCollected = 0;
    lastPointerX = null;
    startWave();
  };

  const spawnBug = () => {
    const isBoss = wave % 5 === 0 && spawnLeft === 1;
    const grow = Math.pow(1.28, wave - 1);
    const hp = isBoss ? Math.round(60 * grow) : Math.round(5 * grow + rand(0, wave));
    bugs.push({
      x: W + 2, hp, max: hp, boss: isBoss, hit: 0,
      speed: isBoss ? 5 : Math.min(20, 8 + wave * 0.8) + rand(-1, 1.5),
      size: isBoss ? 24 : 16,
    });
  };

  // ── 種子 ──
  const collect = (n, direct = false) => {
    collected += n;
    if (direct || flows.length > 50) { ammo += n; return; }
    for (let i = 0; i < n; i++) flows.push({ d: -i * 6 });
  };

  const addSeed = (x, y, vx, vy, mask) => {
    if (seeds.length >= SEED_CAP) {
      // 畫面上種子太多時，直接送進水管，避免拖慢效能
      collect(1, true);
      return;
    }
    seeds.push({ x, y, px: x, py: y, vx, vy, mask });
  };

  // 水管路線：漏斗開口 → 往下 → 往左 → 沿左牆往上 → 勇者
  const PATH = [[CX, FUNNEL_BOTTOM + 2], [CX, PIPE_Y], [4, PIPE_Y], [4, DIRT_Y - 4], [HERO_X, DIRT_Y - 4]];
  const SEGS = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
  const PATH_LEN = SEGS.reduce((a, b) => a + b, 0);
  const pathPoint = (d) => {
    for (let i = 0; i < SEGS.length; i++) {
      if (d <= SEGS[i]) {
        const k = d / SEGS[i];
        return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k];
      }
      d -= SEGS[i];
    }
    return PATH[PATH.length - 1];
  };

  const updateSeeds = (dt) => {
    const G = 230;
    const count = seeds.length; // 這一幀新分裂的種子，下一幀才開始移動
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.px = s.x; s.py = s.y;
      s.vy = Math.min(150, s.vy + G * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < FIELD_L) { s.x = FIELD_L; s.vx = Math.abs(s.vx) * 0.6; }
      if (s.x > FIELD_R - 3) { s.x = FIELD_R - 3; s.vx = -Math.abs(s.vx) * 0.6; }

      // 穿過閘門：上一幀在閘門上方、這一幀在下方
      for (const g of gates) {
        if (s.mask & (1 << g.id)) continue;
        if (!(s.py < g.y && s.y >= g.y && s.x + 2 >= g.x && s.x <= g.x + g.w)) continue;
        if (g.type === "locked") continue;
        s.mask |= 1 << g.id;
        if (g.type === "half") {
          if (Math.random() < 0.5) { s.dead = true; g.flash = 0.15; }
          continue;
        }
        g.flash = 0.12;
        for (let k = 1; k < g.mult; k++) {
          addSeed(s.x + rand(-2, 2), g.y + 1, s.vx + rand(-35, 35), s.vy * 0.5, s.mask);
        }
        if (Math.random() < 0.03) PX.beep(900 + g.mult * 60, 0.03, "square", 0.025);
      }

      // 漏斗：碰到斜面就沿著斜面滑向中間的開口
      if (s.y >= FUNNEL_TOP - 3) {
        if (Math.abs(s.x + 1 - CX) <= HOLE) {
          if (s.y >= FUNNEL_BOTTOM) { s.dead = true; collect(1); }
        } else {
          const fy = funnelY(s.x) - 3;
          if (s.y >= fy) {
            s.y = fy;
            s.vy = 25;
            s.vx = s.x < CX ? 75 : -75;
          }
        }
      }
    }
    seeds = seeds.filter((s) => !s.dead);
  };

  // ── 戰場 ──
  const gameOver = () => {
    state = "over"; stateT = 0;
    if (score > best) { best = PX.best("seed-rush", score); newRecord = true; }
    PX.beep(220, 0.5, "triangle", 0.08, -160);
  };

  const updateBattle = (dt) => {
    if (spawnLeft > 0) {
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnBug();
        spawnLeft--;
        spawnT = Math.max(0.55, 1.7 - wave * 0.06) * rand(0.7, 1.3);
      }
    }
    for (const b of bugs) {
      b.x -= b.speed * dt;
      b.hit = Math.max(0, b.hit - dt);
      if (b.x <= HERO_X + 22) {
        b.dead = true;
        hearts -= 1; hurtFlash = 0.35; shake = 0.3;
        PX.beep(140, 0.3, "sawtooth", 0.07, -80);
        if (hearts <= 0) { gameOver(); return; }
      }
    }

    // 自動射擊：子彈庫存越多，射速越快
    let target = null;
    // 蟲要完整走進畫面一段距離才開始射，讓玩家看得到牠
    for (const b of bugs) if (!b.dead && b.x < W - b.size - 12 && (!target || b.x < target.x)) target = b;
    fireT -= dt;
    if (target && ammo > 0 && fireT <= 0) {
      ammo--;
      bullets.push({ x: HERO_X + 24, y: GROUND_Y - 12 + rand(-2, 2) });
      fireT = 1 / Math.min(12, 2 + ammo / 20);
      if (Math.random() < 0.3) PX.beep(1200, 0.02, "square", 0.02);
    }
    for (const bl of bullets) {
      bl.x += 130 * dt;
      for (const b of bugs) {
        if (b.dead || bl.x < b.x || bl.x > b.x + b.size) continue;
        bl.dead = true;
        b.hp -= 1;
        b.hit = 0.06;
        if (b.hp <= 0) {
          b.dead = true;
          kills++;
          score += b.max;
          pop(b.x + b.size / 2, GROUND_Y - b.size - 12, `+${b.max}`, b.boss ? C.orange : C.yellow);
          PX.beep(b.boss ? 330 : 660, b.boss ? 0.3 : 0.06, "square", 0.05);
        }
        break;
      }
      if (bl.x > W) bl.dead = true;
    }
    bullets = bullets.filter((b) => !b.dead);
    bugs = bugs.filter((b) => !b.dead);

    if (spawnLeft === 0 && bugs.length === 0) {
      state = "clear"; stateT = 0;
      score += wave * 20;
      PX.beep(523, 0.1); PX.beep(659, 0.1); PX.beep(784, 0.15);
    }
  };

  const game = {
    width: W, height: H,
    init() { best = PX.best("seed-rush"); reset(); state = "title"; },

    update(dt, api) {
      t += dt; stateT += dt;
      shake = Math.max(0, shake - dt);
      hurtFlash = Math.max(0, hurtFlash - dt);
      pops.forEach((p) => { p.y -= 14 * dt; p.life -= dt; });
      pops = pops.filter((p) => p.life > 0);
      gates.forEach((g) => { g.flash = Math.max(0, (g.flash || 0) - dt); });

      const start = api.hit(" ", "enter") || api.tapped();
      if (state === "title") { if (start) { reset(); state = "play"; PX.beep(523, 0.08); PX.beep(784, 0.12); } return; }
      if (state === "over") { if (stateT > 0.8 && start) { reset(); state = "play"; PX.beep(523, 0.08); } return; }

      // 芭樂移動：鍵盤，或滑鼠／手指拖曳
      let dir = 0;
      if (api.key("ArrowLeft", "a", "A")) dir -= 1;
      if (api.key("ArrowRight", "d", "D")) dir += 1;
      const p = api.input.pointer;
      const prevX = guava.x;
      if (dir) {
        guava.x += dir * 95 * dt;
      } else if (p.down || (p.active && p.x !== lastPointerX && p.y > DIRT_Y)) {
        guava.x += (p.x - guava.x) * Math.min(1, dt * 14);
      }
      lastPointerX = p.x;
      guava.x = Math.max(FIELD_L + 6, Math.min(FIELD_R - 8, guava.x));
      guava.vx = (guava.x - prevX) / dt;

      // 移動閘門與解鎖
      for (const g of gates) {
        if (g.amp) g.x = Math.round(g.baseX + Math.sin(t * 1.3 + g.phase) * g.amp);
        if (g.type === "locked" && collected >= g.need) {
          g.type = "mult";
          g.flash = 0.6;
          pop(g.x + g.w / 2, g.y - 16, "UNLOCK!", C.yellow, 1.2);
          PX.beep(784, 0.08); PX.beep(1047, 0.12);
        }
      }

      // 持續吐籽
      spitT -= dt;
      while (spitT <= 0) {
        addSeed(guava.x, MOUTH_Y, rand(-12, 12) + guava.vx * 0.15, 35, 0);
        spitT += 1 / 2.5; // 每秒 2.5 顆
      }
      updateSeeds(dt);

      // 水管輸送
      for (const f of flows) {
        f.d += 260 * dt;
        if (f.d >= PATH_LEN) { f.done = true; ammo++; }
      }
      flows = flows.filter((f) => !f.done);

      if (state === "play") updateBattle(dt);
      else if (state === "clear") {
        bullets.forEach((b) => { b.x += 130 * dt; });
        bullets = bullets.filter((b) => b.x < W);
        if (stateT > 1.6) { wave++; state = "play"; startWave(); }
      }
    },

    draw(g) {
      const ctx = g.ctx;
      ctx.save();
      if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), 0);

      // 戰場夜空與草地
      g.clear(C.night);
      stars.forEach((s, i) => { if ((Math.floor(t * 2) + i) % 6) g.rect(s.x, s.y, 1, 1, C.lavender); });
      g.rect(0, GROUND_Y, W, DIRT_Y - GROUND_Y, C.green);
      for (let x = 0; x < W; x += 4) g.rect(x, GROUND_Y, 2, 1, C.lime);

      // 地底
      g.rect(0, DIRT_Y, W, H - DIRT_Y, "#3a2418");
      specks.forEach((s) => g.rect(s.x, s.y, 2, 1, "#4d3020"));
      g.rect(0, DIRT_Y, W, 2, "#5a3424");

      // 閘門
      for (const gt of gates) {
        const y = gt.y - 5;
        let fill = gt.mult >= 5 ? C.blue : C.lime;
        let edge = gt.mult >= 5 ? "#1d6fb0" : C.green;
        let ink = C.ink;
        if (gt.type === "half") { fill = C.red; edge = C.plum; ink = C.white; }
        if (gt.type === "locked") { fill = C.gray; edge = C.ink; ink = C.light; }
        if (gt.flash > 0) { fill = C.white; ink = C.ink; }
        g.rect(gt.x, y, gt.w, 12, edge);
        g.rect(gt.x, y, gt.w, 11, fill);
        g.rect(gt.x, y, gt.w, 1, "rgba(255,255,255,0.35)");
        g.rect(gt.x - 2, y - 2, 2, 15, C.peach);
        g.rect(gt.x + gt.w, y - 2, 2, 15, C.peach);
        const cx = gt.x + gt.w / 2;
        const label = gt.type === "half" ? "÷2" : `x${gt.mult}`;
        g.text(label, cx, y - 1, ink, { align: "center" });
        if (gt.type === "locked") {
          const left = Math.max(0, gt.need - collected);
          g.rect(cx - 20, y - 14, 40, 12, "rgba(16,19,31,0.85)");
          g.draw(lock, cx - 17, y - 11);
          g.text(`${left}`, cx + 4, y - 15, C.yellow, { align: "center" });
        }
      }

      // 漏斗
      ctx.fillStyle = "#c08050";
      ctx.beginPath();
      ctx.moveTo(FIELD_L, FUNNEL_TOP); ctx.lineTo(CX - HOLE, FUNNEL_BOTTOM); ctx.lineTo(CX - HOLE, PIPE_Y - 4); ctx.lineTo(FIELD_L, PIPE_Y - 4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(FIELD_R, FUNNEL_TOP); ctx.lineTo(CX + HOLE, FUNNEL_BOTTOM); ctx.lineTo(CX + HOLE, PIPE_Y - 4); ctx.lineTo(FIELD_R, PIPE_Y - 4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#e0a070"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(FIELD_L, FUNNEL_TOP + 0.5); ctx.lineTo(CX - HOLE, FUNNEL_BOTTOM + 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(FIELD_R, FUNNEL_TOP + 0.5); ctx.lineTo(CX + HOLE, FUNNEL_BOTTOM + 0.5); ctx.stroke();

      // 水管：漏斗下方 → 底部 → 左牆往上
      const pipe = (x, y, w, h) => { g.rect(x, y, w, h, "#0b5e3b"); g.rect(x + 1, y + 1, w - 2, h - 2, C.lime); };
      pipe(CX - HOLE - 2, FUNNEL_BOTTOM, HOLE * 2 + 4, 4);
      pipe(CX - 4, FUNNEL_BOTTOM + 3, 8, PIPE_Y - FUNNEL_BOTTOM + 3);
      pipe(0, PIPE_Y - 4, CX + 4, 9);
      pipe(0, DIRT_Y - 8, 9, PIPE_Y - DIRT_Y + 8);
      for (let y = DIRT_Y; y < PIPE_Y; y += 6) g.rect(1, y, 7, 1, C.green);
      for (const f of flows) {
        if (f.d < 0) continue;
        const [x, y] = pathPoint(f.d);
        g.rect(x - 1, y - 1, 2, 2, C.yellow);
      }

      // 種子
      for (const s of seeds) { g.rect(s.x, s.y, 3, 3, "#7a4a20"); g.rect(s.x, s.y, 2, 2, C.peach); }

      // 吐籽芭樂
      const open = Math.floor(t * 8) % 2 === 0;
      g.draw(open ? spitterOpen : spitter, guava.x - 14, SPIT_Y, false, 2);

      // 勇者與子彈
      g.draw(hero, HERO_X - 2, GROUND_Y - 22, false, 2);
      for (const b of bullets) { g.rect(b.x, b.y, 4, 3, C.peach); g.rect(b.x + 1, b.y + 1, 2, 1, C.yellow); }

      // 蟲
      for (const b of bugs) {
        const spr = b.boss ? boss : (Math.floor(t * 6 + b.x) % 2 ? bugA : bugB);
        g.draw(spr, b.x, GROUND_Y - b.size, false, b.size / 8);
        if (b.hit > 0) g.rect(b.x, GROUND_Y - b.size, b.size, b.size, "rgba(255,241,232,0.45)");
        g.text(`${b.hp}`, b.x + b.size / 2, GROUND_Y - b.size - 12, b.boss ? C.orange : C.white, { align: "center", shadow: C.ink });
      }

      pops.forEach((p) => g.text(p.text, p.x, p.y, p.color, { align: "center", shadow: C.ink }));

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.9)");
      g.text(`WAVE ${wave}`, 2, -1, C.yellow);
      g.text(`${score}`, W / 2 + 4, -1, C.white, { align: "center" });
      for (let i = 0; i < 3; i++) g.draw(i < hearts ? heart : heartEmpty, W - 25 + i * 8, 3);
      g.rect(12, DIRT_Y + 2, 44, 12, "rgba(16,19,31,0.8)");
      g.rect(15, DIRT_Y + 6, 3, 3, C.peach);
      g.text(`${ammo}`, 21, DIRT_Y + 1, C.white);

      if (hurtFlash > 0) g.rect(0, 0, W, H, "rgba(255,0,77,0.18)");
      ctx.restore();

      // 覆蓋畫面
      const panel = (y, h) => { g.rect(8, y, W - 16, h, C.white); g.rect(10, y + 2, W - 20, h - 4, C.navy); };
      if (state === "title") {
        panel(70, 120);
        g.text("芭樂吐籽", W / 2, 78, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.text("大作戰", W / 2, 104, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.text("移動芭樂瞄準閘門", W / 2, 134, C.white, { align: "center" });
        g.text("種子越多火力越強", W / 2, 148, C.white, { align: "center" });
        g.text("避開紅色的 ÷2", W / 2, 162, C.pink, { align: "center" });
        if (Math.floor(t * 2) % 2) g.text("點擊開始", W / 2, 174, C.yellow, { align: "center" });
      }
      if (state === "clear") {
        panel(96, 44);
        g.text(`WAVE ${wave} CLEAR!`, W / 2, 104, C.yellow, { align: "center", shadow: C.ink });
        g.text(`BONUS +${wave * 20}`, W / 2, 120, C.white, { align: "center" });
      }
      if (state === "over") {
        panel(76, 104);
        g.text("GAME OVER", W / 2, 84, C.red, { align: "center", size: 24, shadow: C.ink });
        g.text(`SCORE ${score}`, W / 2, 114, C.white, { align: "center" });
        g.text(`WAVE ${wave}　擊退 ${kills} 隻`, W / 2, 128, C.light, { align: "center" });
        g.text(newRecord ? "NEW RECORD!" : `BEST ${best}`, W / 2, 142, newRecord ? C.yellow : C.light, { align: "center" });
        if (stateT > 0.8 && Math.floor(t * 2) % 2) g.text("點擊再玩一次", W / 2, 160, C.white, { align: "center" });
      }
    },
  };

  PX.run(document.getElementById("game"), game);
})();
