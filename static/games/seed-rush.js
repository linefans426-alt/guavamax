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
  const BUBBLE_ROWS = [108, 137, 167, 195]; // 道具泡泡漂浮的高度（閘門之間）
  const FUNNEL_TOP = 206;
  const FUNNEL_BOTTOM = 226;
  const HOLE = 8;               // 漏斗開口半寬
  const PIPE_Y = 242;
  const SEED_CAP = 220;
  const BULLET_SPEED = 160;
  const ENERGY_MAX = 100;

  // ── 場地：每 5 波換一個，勇者的位置、高度（射擊角度）和距離都不同 ──
  const STAGES = [
    { name: "草原之夜", sky: [C.night, "#1d2b53"], ground: C.green, grass: C.lime, heroX: 14, lift: 0, deco: "stars" },
    { name: "黃昏果園", sky: [C.plum, C.orange], ground: C.green, grass: C.lime, heroX: 14, lift: 18, deco: "trees" },
    { name: "雪原", sky: [C.navy, "#5a6aa0"], ground: C.white, grass: C.light, heroX: 34, lift: 0, deco: "snow" },
    { name: "沙漠", sky: [C.orange, C.peach], ground: "#d8a050", grass: C.yellow, heroX: 24, lift: 12, deco: "sun" },
  ];

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

  // 怪物（8×8，依大小縮放）
  const wormA = PX.sprite([
    "..K..K..",
    "...KK...",
    ".KRRRRK.",
    "KRRKKRRK",
    "KRRKKRRK",
    ".KRRRRK.",
    "K.KKKK.K",
    "K......K",
  ], { K: C.ink, R: C.red });
  const wormB = PX.sprite([
    "K.K..K..",
    "...KK...",
    ".KRRRRK.",
    "KRRKKRRK",
    "KRRKKRRK",
    ".KRRRRK.",
    ".KKKKKK.",
    "K......K",
  ], { K: C.ink, R: C.red });
  const flyA = PX.sprite([
    ".WW..WW.",
    "WLLWWLLW",
    ".WWKKWW.",
    "..KYYK..",
    ".KYKKYK.",
    ".KYYYYK.",
    "..KKKK..",
    "...KK...",
  ], { W: C.white, L: C.blue, K: C.ink, Y: C.yellow });
  const flyB = PX.sprite([
    "........",
    "........",
    "WWWKKWWW",
    "LLKYYKLL",
    ".KYKKYK.",
    ".KYYYYK.",
    "..KKKK..",
    "...KK...",
  ], { W: C.white, L: C.blue, K: C.ink, Y: C.yellow });
  const beetle = PX.sprite([
    "...KK...",
    "..KBBK..",
    ".KBLBBK.",
    "KBLBBBBK",
    "KBBKKBBK",
    "KBBKKBBK",
    ".KKKKKK.",
    "K.K..K.K",
  ], { K: C.ink, B: C.blue, L: C.white });
  const hopper = PX.sprite([
    "K.......",
    ".K......",
    "..KGGGK.",
    ".KGWKGGK",
    "KGGGGGGK",
    ".KKGGKK.",
    ".K.KK..K",
    "K....KK.",
  ], { K: C.ink, G: C.lime, W: C.white });
  const bossSpr = PX.sprite([
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

  // ── 怪物種類 ──
  // from：第幾波開始出現；w：出現權重
  const KINDS = {
    worm:   { name: "毛毛蟲",   hpK: 1,   spK: 1,    size: 16, from: 1, w: 5 },
    fly:    { name: "果蠅",     hpK: 0.6, spK: 1.5,  size: 12, from: 2, w: 3, air: true },
    beetle: { name: "硬殼甲蟲", hpK: 2.6, spK: 0.55, size: 18, from: 3, w: 2 },
    hopper: { name: "跳跳蟲",   hpK: 1.1, spK: 1.1,  size: 14, from: 4, w: 2, hop: true },
  };

  // ── 道具（種子打破泡泡就會發動） ──
  const ITEMS = {
    ice:    { label: "冰", name: "冰凍！", color: C.blue },
    double: { label: "雙", name: "雙發槍", color: C.orange },
    spread: { label: "散", name: "散彈槍", color: C.pink },
    pierce: { label: "穿", name: "穿透彈", color: C.yellow },
    bomb:   { label: "爆", name: "炸彈！", color: C.red },
    heart:  { label: "心", name: "+1 愛心", color: C.lime },
  };
  const WEAPON_NAME = { pistol: "手槍", double: "雙發", spread: "散彈", pierce: "穿透" };

  // 背景裝飾（固定位置）
  const specks = Array.from({ length: 70 }, (_, i) => ({
    x: FIELD_L + ((i * 37) % (FIELD_R - FIELD_L)),
    y: DIRT_Y + 8 + ((i * 53) % (FUNNEL_TOP - DIRT_Y)),
  }));
  const stars = Array.from({ length: 18 }, (_, i) => ({ x: (i * 41) % W, y: HUD_H + 3 + ((i * 17) % 34) }));

  // ── 遊戲狀態 ──
  let state, t, stateT, best, newRecord;
  let wave, hearts, score, ammo, collected, kills, stage;
  let guava, seeds, gates, flows, bugs, bullets, pops, bubbles, shake;
  let spawnLeft, spawnT, fireT, spitT, waveStartCollected, hurtFlash, lastPointerX;
  let weapon, weaponT, freezeT, energy, beamT, bubbleT, flashT;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pop = (x, y, text, color, life = 0.8) => pops.push({ x, y, text, color, life });
  const grow = () => Math.pow(1.22, wave - 1);
  const heroY = () => GROUND_Y - stage.lift;

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

  // 水管路線：漏斗開口 → 往下 → 往左 → 沿左牆往上 → 勇者腳下（依場地重算）
  let PATH, SEGS, PATH_LEN;
  const buildPath = () => {
    PATH = [[CX, FUNNEL_BOTTOM + 2], [CX, PIPE_Y], [4, PIPE_Y], [4, DIRT_Y - 4], [stage.heroX + 8, DIRT_Y - 4]];
    SEGS = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
    PATH_LEN = SEGS.reduce((a, b) => a + b, 0);
  };
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

  const startWave = () => {
    const isBossWave = wave % 5 === 0;
    const newStage = STAGES[Math.floor((wave - 1) / 5) % STAGES.length];
    const stageChanged = newStage !== stage;
    stage = newStage;
    buildPath();
    spawnLeft = isBossWave ? 3 + Math.floor(wave / 2) : Math.round(4 + wave * 1.5);
    spawnT = 1.2;
    waveStartCollected = collected;
    bubbleT = rand(3, 5);
    buildGates();
    if (stageChanged && wave > 1) pop(W / 2, 22, `場地：${stage.name}`, C.yellow, 2);
    if (isBossWave) pop(W / 2, 36, "BOSS 來襲！", C.orange, 1.8);
  };

  const reset = () => {
    t = 0; stateT = 0; newRecord = false;
    wave = 1; hearts = 3; score = 0; ammo = 0; collected = 0; kills = 0;
    stage = null;
    guava = { x: CX, vx: 0 };
    seeds = []; flows = []; bugs = []; bullets = []; pops = []; bubbles = [];
    shake = 0; fireT = 0; spitT = 0; hurtFlash = 0; waveStartCollected = 0;
    weapon = "pistol"; weaponT = 0; freezeT = 0; energy = 0; beamT = 0; flashT = 0;
    lastPointerX = null;
    startWave();
  };

  const spawnBug = () => {
    const isBoss = wave % 5 === 0 && spawnLeft === 1;
    let kind = "worm";
    if (!isBoss) {
      const pool = Object.entries(KINDS).filter(([, k]) => wave >= k.from);
      let r = Math.random() * pool.reduce((a, [, k]) => a + k.w, 0);
      for (const [name, k] of pool) { r -= k.w; if (r <= 0) { kind = name; break; } }
    }
    const k = KINDS[kind];
    const base = 5 * grow() + rand(0, wave);
    const hp = isBoss ? Math.round(60 * grow()) : Math.max(1, Math.round(base * k.hpK));
    const size = isBoss ? 24 : k.size;
    bugs.push({
      kind, x: W + 2, y: GROUND_Y, hp, max: hp, boss: isBoss, hit: 0, ph: rand(0, 6), hopT: rand(0, 1),
      speed: isBoss ? 5 : (Math.min(20, 8 + wave * 0.8) + rand(-1, 1.5)) * k.spK,
      size,
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

  // ── 道具 ──
  const spawnBubble = () => {
    const kinds = ["ice", "ice", "double", "spread", "pierce", "bomb"];
    if (hearts < 3 && wave >= 3) kinds.push("heart");
    const fromLeft = Math.random() < 0.5;
    bubbles.push({
      kind: pick(kinds),
      x: fromLeft ? FIELD_L + 10 : FIELD_R - 10,
      y: pick(BUBBLE_ROWS),
      vx: (fromLeft ? 1 : -1) * rand(10, 18),
      need: 6 + wave * 2,
      life: 14,
      ph: rand(0, 6),
    });
  };

  const hurtBug = (b, dmg) => {
    if (b.dead) return;
    b.hp -= dmg;
    b.hit = 0.06;
    if (b.hp <= 0) {
      b.dead = true;
      kills++;
      score += b.max;
      pop(b.x + b.size / 2, b.y - b.size - 12, `+${b.max}`, b.boss ? C.orange : C.yellow);
      PX.beep(b.boss ? 330 : 660, b.boss ? 0.3 : 0.06, "square", 0.05);
    }
  };

  const activate = (bb) => {
    const it = ITEMS[bb.kind];
    pop(bb.x, bb.y - 14, it.name, it.color, 1.2);
    PX.beep(880, 0.06); PX.beep(1320, 0.1);
    if (bb.kind === "ice") freezeT = 6;
    else if (bb.kind === "bomb") {
      flashT = 0.3; shake = 0.35;
      PX.beep(110, 0.4, "sawtooth", 0.08, -60);
      const dmg = Math.round(12 * grow());
      bugs.forEach((b) => hurtBug(b, dmg));
    } else if (bb.kind === "heart") hearts = Math.min(3, hearts + 1);
    else { weapon = bb.kind; weaponT = 12; }
  };

  const fireBeam = () => {
    energy = 0;
    beamT = 0.45;
    shake = 0.3;
    PX.beep(200, 0.4, "sawtooth", 0.07, 900);
    const dmg = Math.round(25 * grow());
    bugs.forEach((b) => hurtBug(b, b.boss ? dmg * 2 : dmg));
    pop(W / 2, 24, "能量砲！", C.yellow, 1);
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
      if (s.dead) continue;

      // 打到道具泡泡：種子被吸收，泡泡次數 -1
      for (const bb of bubbles) {
        if (bb.dead) continue;
        if (Math.abs(s.x + 1 - bb.x) < 9 && Math.abs(s.y + 1 - bb.y) < 9) {
          s.dead = true;
          bb.need--;
          bb.hit = 0.08;
          if (bb.need <= 0) { bb.dead = true; activate(bb); }
          break;
        }
      }
      if (s.dead) continue;

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

  const shoot = (target) => {
    // 子彈庫存越多：射速越快、每發威力越大（一發打包好幾顆種子）
    const pack = Math.max(1, Math.min(ammo, Math.round(ammo / 30)));
    ammo -= pack;
    const ox = stage.heroX + 24, oy = heroY() - 12;
    const tx = target.x + target.size / 2, ty = target.y - target.size / 2;
    const base = Math.atan2(ty - oy, tx - ox);
    const make = (ang, dy = 0, extra = {}) =>
      bullets.push({ x: ox, y: oy + dy, vx: Math.cos(ang) * BULLET_SPEED, vy: Math.sin(ang) * BULLET_SPEED, dmg: pack, ...extra });
    if (weapon === "double") { make(base, -3); make(base, 3); }
    else if (weapon === "spread") { make(base - 0.3); make(base); make(base + 0.3); }
    else if (weapon === "pierce") make(base, 0, { pierce: true, hits: new Set() });
    else make(base);
    fireT = 1 / Math.min(10, 3 + ammo / 30);
    if (Math.random() < 0.3) PX.beep(1200, 0.02, "square", 0.02);
  };

  const moveBullets = (dt, hitBugs) => {
    for (const bl of bullets) {
      bl.x += bl.vx * dt;
      bl.y += bl.vy * dt;
      if (hitBugs) {
        for (const b of bugs) {
          if (b.dead || (bl.hits && bl.hits.has(b))) continue;
          if (bl.x + 3 < b.x || bl.x > b.x + b.size || bl.y + 3 < b.y - b.size || bl.y > b.y) continue;
          hurtBug(b, bl.dmg);
          energy = Math.min(ENERGY_MAX, energy + 1.5);
          if (bl.pierce) { bl.hits.add(b); continue; }
          bl.dead = true;
          break;
        }
      }
      if (bl.x > W || bl.x < 0 || bl.y < HUD_H || bl.y > GROUND_Y + 2) bl.dead = true;
    }
    bullets = bullets.filter((b) => !b.dead);
  };

  const updateBattle = (dt) => {
    if (spawnLeft > 0) {
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnBug();
        spawnLeft--;
        spawnT = Math.max(0.6, 1.8 - wave * 0.06) * rand(0.7, 1.3);
      }
    }

    // 道具泡泡
    bubbleT -= dt;
    if (bubbleT <= 0) { spawnBubble(); bubbleT = rand(7, 11); }

    const slow = freezeT > 0 ? 0.35 : 1;
    for (const b of bugs) {
      b.ph += dt;
      b.hit = Math.max(0, b.hit - dt);
      const k = KINDS[b.kind];
      if (k.air && !b.boss) {
        b.x -= b.speed * slow * dt;
        b.y = GROUND_Y - 18 - Math.sin(b.ph * 3) * 7;
      } else if (k.hop && !b.boss) {
        b.hopT += dt * slow;
        const c = b.hopT % 1.2;
        if (c < 0.45) {
          b.x -= b.speed * 2.6 * slow * dt;
          b.y = GROUND_Y - Math.sin((c / 0.45) * Math.PI) * 14;
        } else b.y = GROUND_Y;
      } else {
        b.x -= b.speed * slow * dt;
      }
      if (b.x <= stage.heroX + 22) {
        b.dead = true;
        hearts -= 1; hurtFlash = 0.35; shake = 0.3;
        PX.beep(140, 0.3, "sawtooth", 0.07, -80);
        if (hearts <= 0) { gameOver(); return; }
      }
    }

    // 自動射擊：蟲要完整走進畫面一段距離才開始射，讓玩家看得到牠
    let target = null;
    for (const b of bugs) if (!b.dead && b.x < W - b.size - 8 && (!target || b.x < target.x)) target = b;
    fireT -= dt;
    if (target && ammo > 0 && fireT <= 0) shoot(target);
    moveBullets(dt, true);
    bugs = bugs.filter((b) => !b.dead);

    if (spawnLeft === 0 && bugs.length === 0) {
      state = "clear"; stateT = 0;
      score += wave * 20;
      PX.beep(523, 0.1); PX.beep(659, 0.1); PX.beep(784, 0.15);
    }
  };

  // ── 背景 ──
  const mix = (a, b, k) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("");
  };

  const drawSky = (g) => {
    const top = HUD_H, bands = 6, h = (GROUND_Y - top) / bands;
    for (let i = 0; i < bands; i++) g.rect(0, top + i * h, W, Math.ceil(h) + 1, mix(stage.sky[0], stage.sky[1], i / (bands - 1)));
    if (stage.deco === "stars") {
      stars.forEach((s, i) => { if ((Math.floor(t * 2) + i) % 6) g.rect(s.x, s.y, 1, 1, C.lavender); });
    } else if (stage.deco === "trees") {
      g.rect(120, 22, 10, 10, C.yellow);
      for (let x = 50; x < W; x += 34) {
        g.rect(x + 6, GROUND_Y - 14, 3, 14, "#4a2030");
        g.rect(x, GROUND_Y - 24, 15, 11, "#4a2030");
        g.rect(x + 2, GROUND_Y - 27, 11, 3, "#4a2030");
      }
    } else if (stage.deco === "snow") {
      for (let i = 0; i < 24; i++) {
        const x = (i * 29 + t * 8 * (1 + (i % 3))) % W;
        const y = HUD_H + ((i * 13 + t * 14 * (1 + (i % 2))) % (GROUND_Y - HUD_H));
        g.rect(x, y, 1, 1, C.white);
      }
    } else if (stage.deco === "sun") {
      g.rect(118, 18, 14, 14, C.white);
      g.rect(116, 20, 18, 10, C.white);
      for (let x = 60; x < W; x += 46) {
        g.rect(x, GROUND_Y - 16, 4, 16, C.green);
        g.rect(x - 4, GROUND_Y - 11, 4, 2, C.green);
        g.rect(x - 4, GROUND_Y - 14, 2, 4, C.green);
        g.rect(x + 4, GROUND_Y - 9, 4, 2, C.green);
        g.rect(x + 6, GROUND_Y - 12, 2, 4, C.green);
      }
    }
    g.rect(0, GROUND_Y, W, DIRT_Y - GROUND_Y, stage.ground);
    for (let x = 0; x < W; x += 4) g.rect(x, GROUND_Y, 2, 1, stage.grass);
  };

  const game = {
    width: W, height: H,
    init() { best = PX.best("seed-rush"); reset(); state = "title"; },

    update(dt, api) {
      t += dt; stateT += dt;
      shake = Math.max(0, shake - dt);
      hurtFlash = Math.max(0, hurtFlash - dt);
      flashT = Math.max(0, flashT - dt);
      beamT = Math.max(0, beamT - dt);
      pops.forEach((p) => { p.y -= 14 * dt; p.life -= dt; });
      pops = pops.filter((p) => p.life > 0);
      gates.forEach((g) => { g.flash = Math.max(0, (g.flash || 0) - dt); });

      const p = api.input.pointer;
      const start = api.hit(" ", "enter") || api.tapped();
      if (state === "title") { if (start) { reset(); state = "play"; PX.beep(523, 0.08); PX.beep(784, 0.12); } return; }
      if (state === "over") { if (stateT > 0.8 && start) { reset(); state = "play"; PX.beep(523, 0.08); } return; }

      // 能量滿了：點戰場或按空白鍵／↑ 發射能量砲
      if (energy >= ENERGY_MAX && state === "play" &&
          (api.hit(" ", "arrowup", "w") || (api.tapped() && p.y < DIRT_Y))) fireBeam();

      // 芭樂移動：鍵盤，或滑鼠／手指拖曳（在戰場上按住不算）
      let dir = 0;
      if (api.key("ArrowLeft", "a", "A")) dir -= 1;
      if (api.key("ArrowRight", "d", "D")) dir += 1;
      const prevX = guava.x;
      if (dir) {
        guava.x += dir * 95 * dt;
      } else if ((p.down && p.y > DIRT_Y) || (p.active && p.x !== lastPointerX && p.y > DIRT_Y)) {
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

      // 道具泡泡漂移
      for (const bb of bubbles) {
        bb.x += bb.vx * dt;
        bb.life -= dt;
        bb.hit = Math.max(0, (bb.hit || 0) - dt);
        if (bb.x < FIELD_L + 8) { bb.x = FIELD_L + 8; bb.vx = Math.abs(bb.vx); }
        if (bb.x > FIELD_R - 8) { bb.x = FIELD_R - 8; bb.vx = -Math.abs(bb.vx); }
        if (bb.life <= 0) bb.dead = true;
      }
      bubbles = bubbles.filter((b) => !b.dead);

      // 計時效果
      freezeT = Math.max(0, freezeT - dt);
      if (weaponT > 0) { weaponT -= dt; if (weaponT <= 0) weapon = "pistol"; }

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
        moveBullets(dt, false);
        if (stateT > 1.6) { wave++; state = "play"; startWave(); }
      }
    },

    draw(g) {
      const ctx = g.ctx;
      ctx.save();
      if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), 0);

      g.clear(C.night);
      drawSky(g);

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

      // 道具泡泡
      for (const bb of bubbles) {
        const it = ITEMS[bb.kind];
        if (bb.life < 3 && Math.floor(t * 8) % 2) continue; // 快消失時閃爍
        const y = bb.y + Math.sin(t * 3 + bb.ph) * 2;
        ctx.fillStyle = bb.hit > 0 ? C.white : it.color;
        ctx.beginPath(); ctx.arc(Math.round(bb.x), Math.round(y), 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.arc(Math.round(bb.x), Math.round(y), 7, 0, Math.PI * 2); ctx.fill();
        g.rect(bb.x - 4, y - 6, 2, 2, "rgba(255,255,255,0.6)");
        g.text(it.label, bb.x, y - 7, it.color, { align: "center" });
        g.text(`${bb.need}`, bb.x, y + 8, C.white, { align: "center", shadow: C.ink });
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

      // 勇者的台座（高台＝往下射的角度）
      const hx = stage.heroX, hy = heroY();
      if (stage.lift) {
        g.rect(hx + 1, hy, 22, GROUND_Y - hy + 2, "#5a3424");
        g.rect(hx + 2, hy, 20, 2, C.brown);
        for (let y = hy + 4; y < GROUND_Y; y += 4) g.rect(hx + 3, y, 18, 1, "#3a2418");
      }

      // 水管：漏斗下方 → 底部 → 左牆往上 → 勇者腳下
      const pipe = (x, y, w, h) => { g.rect(x, y, w, h, "#0b5e3b"); g.rect(x + 1, y + 1, w - 2, h - 2, C.lime); };
      pipe(CX - HOLE - 2, FUNNEL_BOTTOM, HOLE * 2 + 4, 4);
      pipe(CX - 4, FUNNEL_BOTTOM + 3, 8, PIPE_Y - FUNNEL_BOTTOM + 3);
      pipe(0, PIPE_Y - 4, CX + 4, 9);
      pipe(0, DIRT_Y - 8, 9, PIPE_Y - DIRT_Y + 8);
      pipe(0, DIRT_Y - 8, hx + 12, 7);
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
      g.draw(hero, hx - 2, hy - 22, false, 2);
      for (const b of bullets) {
        const s = b.dmg >= 20 ? 5 : b.dmg >= 5 ? 4 : 3;
        g.rect(b.x, b.y, s, s, b.pierce ? C.yellow : C.peach);
        g.rect(b.x + 1, b.y + 1, s - 2, s - 2, b.pierce ? C.white : C.yellow);
      }

      // 能量砲光束
      if (beamT > 0) {
        const th = Math.round(4 + beamT * 20);
        g.rect(hx + 22, hy - 12 - th / 2, W, th, "rgba(255,236,39,0.75)");
        g.rect(hx + 22, hy - 13, W, 3, C.white);
      }

      // 蟲
      for (const b of bugs) {
        let spr;
        if (b.boss) spr = bossSpr;
        else if (b.kind === "fly") spr = Math.floor(t * 12) % 2 ? flyA : flyB;
        else if (b.kind === "beetle") spr = beetle;
        else if (b.kind === "hopper") spr = hopper;
        else spr = Math.floor(t * 6 + b.x) % 2 ? wormA : wormB;
        const top = b.y - b.size;
        g.draw(spr, b.x, top, false, b.size / 8);
        if (b.hit > 0) g.rect(b.x, top, b.size, b.size, "rgba(255,241,232,0.45)");
        if (freezeT > 0) g.rect(b.x, top, b.size, b.size, "rgba(41,173,255,0.35)");
        g.text(`${b.hp}`, b.x + b.size / 2, top - 12, b.boss ? C.orange : C.white, { align: "center", shadow: C.ink });
      }

      pops.forEach((p) => g.text(p.text, p.x, p.y, p.color, { align: "center", shadow: C.ink }));

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.9)");
      g.text(`WAVE ${wave}`, 2, -1, C.yellow);
      g.text(`${score}`, W / 2 + 4, -1, C.white, { align: "center" });
      for (let i = 0; i < 3; i++) g.draw(i < hearts ? heart : heartEmpty, W - 25 + i * 8, 3);

      // 地底上方的狀態列：子彈數、能量、武器
      g.rect(12, DIRT_Y + 2, 44, 12, "rgba(16,19,31,0.8)");
      g.rect(15, DIRT_Y + 6, 3, 3, C.peach);
      g.text(`${ammo}`, 21, DIRT_Y + 1, C.white);
      const full = energy >= ENERGY_MAX;
      g.rect(60, DIRT_Y + 5, 42, 6, C.ink);
      g.rect(61, DIRT_Y + 6, Math.round(40 * energy / ENERGY_MAX), 4, full && Math.floor(t * 6) % 2 ? C.white : C.yellow);
      g.rect(106, DIRT_Y + 2, 48, 12, "rgba(16,19,31,0.8)");
      const wcol = weapon === "pistol" ? C.light : ITEMS[weapon].color;
      g.text(WEAPON_NAME[weapon], 109, DIRT_Y + 1, wcol);
      if (weaponT > 0) g.rect(108, DIRT_Y + 12, Math.round(44 * weaponT / 12), 1, wcol);
      if (freezeT > 0) g.text("冰", 142, DIRT_Y + 1, C.blue);
      if (full && state === "play") {
        g.text("能量滿！點戰場發射", W / 2, HUD_H + 1, Math.floor(t * 4) % 2 ? C.yellow : C.white, { align: "center", shadow: C.ink });
      }

      if (hurtFlash > 0) g.rect(0, 0, W, H, "rgba(255,0,77,0.18)");
      if (flashT > 0) g.rect(0, 0, W, DIRT_Y, "rgba(255,241,232,0.5)");
      ctx.restore();

      // 覆蓋畫面
      const panel = (y, h) => { g.rect(8, y, W - 16, h, C.white); g.rect(10, y + 2, W - 20, h - 4, C.navy); };
      if (state === "title") {
        panel(64, 134);
        g.text("芭樂吐籽", W / 2, 72, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.text("大作戰", W / 2, 98, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.text("移動芭樂瞄準閘門", W / 2, 128, C.white, { align: "center" });
        g.text("種子越多火力越強", W / 2, 142, C.white, { align: "center" });
        g.text("用種子打破道具泡泡", W / 2, 156, C.lime, { align: "center" });
        g.text("避開紅色的 ÷2", W / 2, 170, C.pink, { align: "center" });
        if (Math.floor(t * 2) % 2) g.text("點擊開始", W / 2, 183, C.yellow, { align: "center" });
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
