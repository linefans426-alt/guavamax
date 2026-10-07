/* 毛毛狗大冒險 Fluffy Dash */
(() => {
  const { C } = PX;
  const W = 256, H = 144;

  // ── 版面 ──
  const HUD_H = 14;
  const BAR_Y = 128;                 // 下方技能列
  const LANE_Y = [76, 120];          // 兩條路的腳底高度
  const MID_Y = (LANE_Y[0] + LANE_Y[1]) / 2 - 12;
  const DOG_X = 40;
  const BOSS_EVERY = 1100;           // 每跑多遠出現一次 Boss
  const BARK_NEED = 8;               // 打倒幾隻怪可以汪一次

  // ── 像素圖 ──
  const dogColors = { W: C.white, L: C.light, K: C.ink, R: C.pink, N: "#16121f" };
  const dogA = PX.sprite([
    "..........WWWWWW....",
    "........WWWWWWWWWW..",
    ".......WWWWWWWWWWWW.",
    ".......WWKKWWWWKKWWL",
    ".......WWKKWWWWKKWWL",
    ".......WRRWWNNWWRRWL",
    "..W....WWWWWNNWWWWW.",
    ".WW.....WWWWWWWWWW..",
    ".WWWWWWWWWWWWWWWW...",
    "LWWWWWWWWWWWWWWWL...",
    "LWWWWWWWWWWWWWWWL...",
    ".LWWWWWWWWWWWWWL....",
    "..WW.WW....WW.WW....",
    "..LL.LL....LL.LL....",
  ], dogColors);
  const dogB = PX.sprite([
    "..........WWWWWW....",
    "........WWWWWWWWWW..",
    ".......WWWWWWWWWWWW.",
    ".......WWKKWWWWKKWWL",
    ".......WWKKWWWWKKWWL",
    ".......WRRWWNNWWRRWL",
    ".W.....WWWWWNNWWWWW.",
    "WW......WWWWWWWWWW..",
    ".WWWWWWWWWWWWWWWW...",
    "LWWWWWWWWWWWWWWWL...",
    "LWWWWWWWWWWWWWWWL...",
    ".LWWWWWWWWWWWWWL....",
    ".WW...WW..WW...WW...",
    ".LL...LL..LL...LL...",
  ], dogColors);
  const dogHurt = PX.sprite([
    "..........WWWWWW....",
    "........WWWWWWWWWW..",
    ".......WWWWWWWWWWWW.",
    ".......WWKWWWWWWKWWL",
    ".......WWWKWWWWKWWWL",
    ".......WRRWWNNWWRRWL",
    "..W....WWWWWNNWWWWW.",
    ".WW.....WWWWWWWWWW..",
    ".WWWWWWWWWWWWWWWW...",
    "LWWWWWWWWWWWWWWWL...",
    "LWWWWWWWWWWWWWWWL...",
    ".LWWWWWWWWWWWWWL....",
    "..WW.WW....WW.WW....",
    "..LL.LL....LL.LL....",
  ], dogColors);

  // 怪物（面向左）
  const cat = PX.sprite([
    "K.......K...",
    "KK.....KK...",
    "KOOOOOOOK...",
    "KOKOOOKOK...",
    "KOOOPOOOK...",
    ".KOOOOOK..K.",
    "..KOOOOOK.OK",
    "..KOWOWOOOK.",
    "..KOOOOOOK..",
    "..KK.K.KK...",
  ], { K: C.ink, O: C.orange, P: C.pink, W: C.white });
  const crow = PX.sprite([
    "...KKKK.....",
    "..KKWKKK....",
    "YYKKKKKKK...",
    "..KKKKKKKKK.",
    "...KKLLKKKKK",
    "....KKLLLKK.",
    ".....KKKKK..",
    "......Y.Y...",
  ], { K: "#2a2238", W: C.white, Y: C.orange, L: C.lavender });
  const squirrel = PX.sprite([
    ".K.K......KK",
    "KBKBK....KBBK",
    "KBBBBK..KBBBK",
    "KWBBBK..KBBK.",
    "KBBBBBKKBBK..",
    ".KKBBBBBBK...",
    "..KBPBBBK....",
    "..KBBBBBK....",
    "..KK.KK.K....",
  ].map((r) => r.slice(0, 12)), { K: C.ink, B: C.brown, W: C.white, P: C.peach });
  const vacuum = PX.sprite([
    "......KKKK......",
    ".....KGGGGK.....",
    ".....KGKKGK.....",
    "......KGGK......",
    "......KGGK......",
    "...KKKKKKKKKK...",
    "..KRRRRRRRRRRK..",
    ".KRRWWRRRRWWRRK.",
    ".KRRWKRRRRWKRRK.",
    ".KRRRRRRRRRRRRK.",
    ".KRRRKKKKKKRRRK.",
    ".KRRRRRRRRRRRRK.",
    "..KKKKKKKKKKKK..",
    "..KGGK....KGGK..",
    "KKKKKKKKKKKKKKKK",
    "KLLLLLLLLLLLLLLK",
  ], { K: C.ink, G: C.gray, R: C.red, W: C.white, L: C.light });
  const dryer = PX.sprite([
    "..KKKKKKKKK.....",
    ".KBBBBBBBBBK....",
    "KBBWWBBBBBBKKKK.",
    "KBBWKBBBBBBBBBBK",
    "KBBBBBBBBBBBBBBK",
    "KBBBKKKKBBBBKKK.",
    ".KBBBBBBBBBK....",
    "..KKKKKBBBK.....",
    "......KBBBK.....",
    "......KBBBK.....",
    "......KBBBK.....",
    "......KBBBK.....",
    ".....KKKKKKK....",
    "....KLLLLLLLK...",
    "....KKKKKKKKK...",
    "................",
  ], { K: C.ink, B: C.blue, W: C.white, L: C.light });

  // 卡片圖示
  const bone = PX.sprite([
    "WW......WW",
    "WWWWWWWWWW",
    ".WWWWWWWW.",
    "WWWWWWWWWW",
    "WW......WW",
  ], { W: C.white });
  const ball = PX.sprite([
    "..RRRR..",
    ".RRWRRR.",
    "RRWWRRRR",
    "WWWWWWWW",
    "RRRRWWRR",
    "RRRRRWWR",
    ".RRRRRR.",
    "..RRRR..",
  ], { R: C.red, W: C.white });
  const poop = PX.sprite([
    "...BB...",
    "..BBBB..",
    "..BWBW..",
    ".BBBBBB.",
    ".BKBBKB.",
    "BBBBBBBB",
    "BBBBBBBB",
  ], { B: C.brown, W: C.white, K: C.ink });
  const tub = PX.sprite([
    ".W..W.W...",
    "W.WW...W..",
    ".W..W..W..",
    "LLLLLLLLLL",
    "KBBBBBBBBK",
    "KBBBBBBBBK",
    ".KBBBBBBK.",
    "..K....K..",
  ], { W: C.white, L: C.light, B: C.blue, K: C.ink });
  const heartSpr = PX.sprite([".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."], { R: C.red });
  const heartEmpty = PX.sprite([".KK.KK.", "K..K..K", "K.....K", ".K...K.", "..K.K..", "...K..."], { K: C.lavender });
  const star = PX.sprite(["..Y..", ".YYY.", "YYYYY", ".YYY.", ".Y.Y."], { Y: C.yellow });

  const ENEMIES = {
    cat: { spr: cat, name: "野貓" },
    crow: { spr: crow, name: "烏鴉", fly: true },
    squirrel: { spr: squirrel, name: "松鼠" },
  };
  const BOSSES = [
    { spr: vacuum, name: "吸塵器大魔王" },
    { spr: dryer, name: "吹風機怪獸" },
  ];

  // ── 狀態 ──
  let state, t, stateT, best;
  let dog, objs, pops, dist, expect, nextSeg, nextBoss, bossCount, speed, energy, barkT, shake, flash;
  let maxPower, kills, lastPointerY, pendingLane;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // 大數字縮寫：K、M、B、T，再大就用 aa、ab…（放置型遊戲常見的寫法）
  const fmt = (n) => {
    n = Math.floor(n);
    if (n < 10000) return String(n);
    const units = ["K", "M", "B", "T"];
    let i = -1;
    while (n >= 1000 && i < 200) { n /= 1000; i++; }
    const u = i < units.length ? units[i] : String.fromCharCode(97 + Math.floor((i - 4) / 26)) + String.fromCharCode(97 + ((i - 4) % 26));
    return (n < 100 ? n.toFixed(1) : Math.floor(n)) + u;
  };
  const pop = (x, y, text, color, life = 0.9, size = 12) => pops.push({ x, y, text, color, life, size });

  const reset = () => {
    t = 0; stateT = 0;
    dog = { lane: 0, y: LANE_Y[0], power: 1, hearts: 3, hurt: 0, eat: 0 };
    objs = []; pops = [];
    dist = 0; expect = 1; nextSeg = 60; nextBoss = BOSS_EVERY; bossCount = 0;
    speed = 44; energy = 0; barkT = 0; shake = 0; flash = 0;
    maxPower = 1; kills = 0; lastPointerY = null; pendingLane = null;
  };

  // ── 關卡產生 ──
  const goodCard = () => {
    const P = dog.power;
    const r = Math.random();
    if (dog.hearts < 3 && r < 0.12) return { kind: "card", type: "heart", label: "+1", good: true };
    if (dist > 250 && r < 0.4) return { kind: "card", type: "mul", v: Math.random() < 0.2 && dist > 900 ? 3 : 2, good: true };
    const v = Math.max(2, Math.ceil(P * rand(0.4, 1.1)) + Math.floor(rand(1, 4)));
    return { kind: "card", type: "add", v, good: true };
  };
  const badCard = () => {
    const P = dog.power;
    if (P >= 6 && Math.random() < 0.4) return { kind: "card", type: "div", v: 2, good: false };
    return { kind: "card", type: "sub", v: Math.max(1, Math.ceil(P * rand(0.3, 0.6))), good: false };
  };
  const cardLabel = (c) => ({ add: `+${fmt(c.v)}`, mul: `x${c.v}`, sub: `-${fmt(c.v)}`, div: `÷${c.v}`, heart: "+1" }[c.type]);

  const spawnCards = (x) => {
    const pair = Math.random() < 0.72 ? [goodCard(), badCard()] : [goodCard(), goodCard()];
    if (Math.random() < 0.5) pair.reverse();
    pair.forEach((c, lane) => objs.push({ ...c, lane, x }));
  };

  const enemyKind = () => {
    const pool = ["cat", "cat", "squirrel"];
    if (dist > 300) pool.push("crow", "crow");
    return pick(pool);
  };
  const makeEnemy = (lane, x, v) => ({ kind: "enemy", type: enemyKind(), lane, x, v: Math.max(1, Math.round(v)), ph: rand(0, 6) });

  // 怪物的數字跟著「預期戰力」成長，而不是跟著你現在的數字：
  // 選錯卡片掉下來的數字會一直影響後面，選對的話後面就會比較輕鬆
  const spawnEnemies = (x) => {
    const P = expect;
    const weak = () => P * rand(0.3, 0.85);
    const strong = () => P * rand(1.3, 2.2) + 2;
    const r = Math.random();
    const a = Math.random() < 0.5 ? 0 : 1, b = 1 - a;
    if (dist < 120) {
      objs.push(makeEnemy(a, x, Math.max(1, Math.floor(P * 0.6))));
    } else if (r < 0.3) {
      // 一邊打得過、一邊打不過
      objs.push(makeEnemy(a, x, weak()));
      objs.push(makeEnemy(b, x, strong()));
    } else if (r < 0.55) {
      // 兩邊都打得過：選數字大的吃比較多
      objs.push(makeEnemy(a, x, P * rand(0.2, 0.45)));
      objs.push(makeEnemy(b, x, P * rand(0.55, 0.9)));
    } else if (dist > 400 && r < 0.68) {
      // 陷阱：一邊是很強的怪、另一邊是壞卡片，只能選比較不痛的
      objs.push(makeEnemy(a, x, strong()));
      objs.push({ ...badCard(), lane: b, x });
    } else if (r < 0.85) {
      // 同一條路連續兩隻（要累積起來才打得贏第二隻）
      const v1 = P * rand(0.4, 0.8);
      objs.push(makeEnemy(a, x, v1));
      objs.push(makeEnemy(a, x + 22, (P + v1) * rand(0.5, 0.9)));
    } else {
      // 只有一隻很強的，閃開就好
      objs.push(makeEnemy(a, x, strong()));
    }
  };

  const spawnBoss = (x) => {
    const P = dog.power;
    const b = BOSSES[bossCount % BOSSES.length];
    bossCount++;
    // 卡片在前、Boss 在後；好卡片選對才打得贏
    // 一張 x2、一張 +數字（+數字不一定夠），選哪張自己算
    const lanes = Math.random() < 0.5 ? [0, 1] : [1, 0];
    objs.push({ kind: "card", type: "mul", v: 2, good: true, lane: lanes[0], x });
    objs.push({ kind: "card", type: "add", v: Math.max(2, Math.ceil(P * rand(0.4, 1))), good: true, lane: lanes[1], x });
    objs.push({ kind: "boss", boss: b, x: x + 120, v: Math.ceil(Math.max(P, expect) * rand(1.5, 1.85)) + 5, ph: 0 });
    expect *= 2.2;
    pop(W / 2, 40, `${b.name} 來襲！`, C.orange, 2.2);
    PX.beep(220, 0.2, "square", 0.05); PX.beep(180, 0.3, "square", 0.05);
  };

  const spawnNext = () => {
    const x = W + 16;
    if (dist >= nextBoss) {
      spawnBoss(x);
      nextBoss += BOSS_EVERY;
      nextSeg = dist + 210;
      return;
    }
    const r = Math.random();
    const creep = 1 + dist / 8000; // 跑越遠，預期戰力成長越快
    if (r < 0.45) { spawnCards(x); nextSeg = dist + rand(70, 95); expect *= 1 + 0.45 * creep; }
    else { spawnEnemies(x); nextSeg = dist + rand(85, 115); expect *= 1 + 0.36 * creep; }
    expect = Math.max(expect, 1);
  };

  // ── 碰撞結算 ──
  const hurt = () => {
    dog.hearts--;
    dog.hurt = 0.6; shake = 0.3;
    PX.beep(140, 0.3, "sawtooth", 0.07, -80);
    if (dog.hearts <= 0) {
      state = "over"; stateT = 0;
      const sc = Math.floor(dist / 10);
      if (sc > best) best = PX.best("fluffy-dash", sc);
      PX.beep(220, 0.5, "triangle", 0.08, -160);
    }
  };

  const resolve = (o) => {
    const P = dog.power;
    const y = o.kind === "boss" ? MID_Y : LANE_Y[o.lane] - 24;
    if (o.kind === "card") {
      let np = P;
      if (o.type === "add") np = P + o.v;
      if (o.type === "mul") np = P * o.v;
      if (o.type === "sub") np = Math.max(1, P - o.v);
      if (o.type === "div") np = Math.max(1, Math.floor(P / o.v));
      if (o.type === "heart") { dog.hearts = Math.min(3, dog.hearts + 1); pop(DOG_X + 8, y, "愛心 +1", C.red); }
      dog.power = np;
      dog.eat = 0.25;
      if (o.good) { PX.beep(880, 0.05); PX.beep(1175, 0.08); }
      else { PX.beep(200, 0.15, "square", 0.05, -60); pop(DOG_X + 8, y - 4, "嗚…", C.light); }
      return;
    }
    // 怪物和 Boss：數字比較大就打倒，吸收對方的數字
    if (P >= o.v) {
      dog.power = P + o.v;
      kills++;
      energy = Math.min(BARK_NEED, energy + 1);
      dog.eat = 0.25;
      for (let k = 0; k < (o.kind === "boss" ? 18 : 8); k++) {
        pops.push({ dot: true, x: o.x + 6, y: y + 10, vx: rand(-60, 60), vy: rand(-90, -20), life: rand(0.3, 0.7), color: pick([C.yellow, C.white, C.orange]) });
      }
      pop(o.x + 6, y - 4, `+${fmt(o.v)}`, C.lime);
      if (o.kind === "boss") {
        flash = 0.3; shake = 0.4;
        dog.hearts = Math.min(3, dog.hearts + 1);
        pop(W / 2, 34, "打倒 Boss！愛心 +1", C.yellow, 1.8);
        PX.beep(523, 0.1); PX.beep(659, 0.1); PX.beep(784, 0.1); PX.beep(1047, 0.2);
      } else PX.beep(660, 0.06, "square", 0.05);
    } else {
      pop(o.x + 6, y - 4, "太強了！", C.red);
      hurt();
    }
  };

  const bark = () => {
    if (energy < BARK_NEED || state !== "play") return;
    energy = 0;
    barkT = 0.6; shake = 0.25;
    PX.beep(330, 0.08, "square", 0.07, 200); PX.beep(300, 0.12, "square", 0.07, 160);
    let n = 0;
    for (const o of objs) {
      if ((o.kind === "enemy" || o.kind === "boss") && o.x < W + 40) { o.v = Math.max(1, Math.floor(o.v / 2)); o.scared = 0.6; n++; }
    }
    pop(DOG_X + 44, dog.y - 22, "汪汪！", C.yellow, 1);
    if (n) pop(W / 2, 34, "怪物被嚇到，數字減半！", C.white, 1.4);
  };

  // ── 主迴圈 ──
  const game = {
    width: W, height: H,
    init() { best = PX.best("fluffy-dash"); reset(); state = "title"; },

    update(dt, api) {
      t += dt; stateT += dt;
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
      barkT = Math.max(0, barkT - dt);
      dog.hurt = Math.max(0, dog.hurt - dt);
      dog.eat = Math.max(0, dog.eat - dt);
      pops.forEach((p) => {
        p.life -= dt;
        if (p.dot) { p.vy += 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; } else p.y -= 12 * dt;
      });
      pops = pops.filter((p) => p.life > 0);

      const p = api.input.pointer;
      const tapped = api.tapped();
      if (state === "title") {
        if (tapped || api.hit(" ", "enter")) { reset(); state = "play"; PX.beep(523, 0.08); PX.beep(784, 0.12); }
        return;
      }
      if (state === "over") {
        if (stateT > 1 && (tapped || api.hit(" ", "enter"))) { reset(); state = "play"; PX.beep(523, 0.08); }
        return;
      }

      // 換路：點上半／下半，或手指拖過去；鍵盤 ↑↓
      if (api.hit("arrowup", "w")) dog.lane = 0;
      if (api.hit("arrowdown", "s")) dog.lane = 1;
      if (api.hit(" ", "b")) bark();
      if (tapped && p.y >= BAR_Y && p.x >= W - 64) bark();
      else if (p.down && p.y > HUD_H && p.y < BAR_Y) dog.lane = p.y < (LANE_Y[0] + LANE_Y[1]) / 2 - 10 ? 0 : 1;
      dog.y += (LANE_Y[dog.lane] - dog.y) * Math.min(1, dt * 16);

      // 前進
      speed = Math.min(78, 44 + dist * 0.006);
      const dx = speed * dt;
      dist += dx;
      if (dist >= nextSeg) spawnNext();
      for (const o of objs) {
        o.x -= dx;
        if (o.scared) o.scared = Math.max(0, o.scared - dt);
        if (o.done) continue;
        if (o.kind === "boss" ? o.x <= DOG_X + 14 : o.x <= DOG_X + 12) {
          if (o.kind === "boss" || o.lane === dog.lane) { o.done = true; o.gone = true; resolve(o); if (state !== "play") return; }
          else if (o.x <= DOG_X - 4) o.done = true;
        }
      }
      objs = objs.filter((o) => o.x > -40 && !o.gone);
      maxPower = Math.max(maxPower, dog.power);
    },

    draw(g) {
      const ctx = g.ctx;
      ctx.save();
      if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 2));

      // 天空與遠景
      g.clear("#8fd3ff");
      g.rect(0, HUD_H, W, 10, "#a8ddff");
      const far = (dist * 0.2) % 48;
      for (let x = -48; x < W + 48; x += 48) {
        const bx = Math.round(x - far);
        g.rect(bx + 4, 30, 34, 12, "#5cae6a");
        g.rect(bx + 10, 24, 22, 8, "#5cae6a");
        g.rect(bx + 16, 20, 10, 6, "#5cae6a");
      }
      g.rect(0, 42, W, 4, "#4c9a5a");
      // 樹（中景）
      const mid = (dist * 0.5) % 64;
      for (let x = -64; x < W + 64; x += 64) {
        const tx = Math.round(x - mid);
        g.rect(tx + 14, 30, 4, 18, "#7a4a28");
        g.rect(tx + 6, 18, 20, 14, "#2e8a48");
        g.rect(tx + 9, 14, 14, 6, "#2e8a48");
        g.rect(tx + 8, 20, 4, 3, "#46a85e");
      }
      // 草地與兩條步道
      g.rect(0, 46, W, BAR_Y - 46, "#7cc86a");
      const near = dist % 16;
      for (let x = -16; x < W + 16; x += 16) {
        g.rect(Math.round(x - near), 50, 2, 1, "#5fb24f");
        g.rect(Math.round(x - near) + 8, 96, 2, 1, "#5fb24f");
      }
      LANE_Y.forEach((ly) => {
        g.rect(0, ly - 14, W, 16, "#e8d4a0");
        g.rect(0, ly + 2, W, 2, "#c8b080");
        const st = dist % 24;
        for (let x = -24; x < W + 24; x += 24) g.rect(Math.round(x - st), ly - 6, 6, 1, "#d6c08a");
      });

      // 物件
      for (const o of objs) {
        const x = Math.round(o.x);
        if (o.kind === "card") {
          const ly = LANE_Y[o.lane];
          const y = ly - 30 + Math.round(Math.sin(t * 4 + o.lane) * 1.5);
          const faded = o.done;
          g.rect(x - 1, y - 1, 24, 26, faded ? "rgba(36,26,58,0.3)" : C.ink);
          g.rect(x, y, 22, 24, faded ? "rgba(255,163,0,0.35)" : C.orange);
          g.rect(x + 1, y + 1, 20, 2, faded ? "rgba(255,255,255,0.2)" : C.yellow);
          const icon = { add: bone, mul: ball, sub: poop, div: tub, heart: heartSpr }[o.type];
          g.draw(icon, x + 11 - Math.round(icon.width / 2), y + 3);
          g.text(cardLabel(o), x + 11, y + 11, o.good ? C.white : C.ink, { align: "center", shadow: o.good ? C.ink : null });
          continue;
        }
        if (o.kind === "enemy") {
          const e = ENEMIES[o.type];
          const ly = LANE_Y[o.lane];
          const hop = e.fly ? -10 + Math.round(Math.sin(t * 5 + o.ph) * 3) : -Math.abs(Math.round(Math.sin(t * 8 + o.ph) * 2));
          const y = ly - e.spr.height * 2 + hop;
          g.draw(e.spr, x - 6, y, false, 2);
          if (o.scared) g.text("!", x + 18, y - 8, C.yellow, { shadow: C.ink });
          const win = dog.power >= o.v;
          g.text(fmt(o.v), x + 6, y - 13, win ? C.lime : C.red, { align: "center", shadow: C.ink });
          continue;
        }
        if (o.kind === "boss") {
          const y = MID_Y - 14 + Math.round(Math.sin(t * 3) * 2);
          g.draw(o.boss.spr, x - 10, y, false, 3);
          const win = dog.power >= o.v;
          g.text(fmt(o.v), x + 14, y - 16, win ? C.lime : C.red, { align: "center", size: 16, shadow: C.ink });
          if (o.scared) g.text("!!", x + 40, y, C.yellow, { shadow: C.ink });
        }
      }

      // 狗狗
      const run = Math.floor(t * 10) % 2;
      const spr = dog.hurt > 0 ? dogHurt : run ? dogA : dogB;
      const bob = dog.hurt > 0 ? 0 : run ? -1 : 0;
      const dy = Math.round(dog.y) - 28 + bob;
      if (!(dog.hurt > 0 && Math.floor(t * 20) % 2)) g.draw(spr, DOG_X - 10, dy, false, 2);
      if (dog.eat > 0) g.draw(star, DOG_X + 28, dy - 2);
      // 頭上的數字
      const pc = dog.eat > 0 ? C.yellow : C.white;
      g.text(fmt(dog.power), DOG_X + 10, dy - 14, pc, { align: "center", size: 14, shadow: C.ink });
      // 汪汪聲波
      if (barkT > 0) {
        const r = (0.6 - barkT) * 300;
        ctx.strokeStyle = `rgba(255,236,39,${barkT})`;
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(DOG_X + 30, dy + 10, Math.max(1, r - k * 14), -0.6, 0.6);
          ctx.stroke();
        }
      }

      // 粒子與文字
      pops.forEach((p) => {
        if (p.dot) g.rect(p.x, p.y, 2, 2, p.color);
        else g.text(p.text, p.x, p.y, p.color, { align: "center", size: p.size, shadow: C.ink });
      });

      // HUD
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.85)");
      for (let i = 0; i < 3; i++) g.draw(i < dog.hearts ? heartSpr : heartEmpty, 3 + i * 9, 4);
      g.text(`${Math.floor(dist / 10)} m`, W / 2, 0, C.white, { align: "center" });
      g.text(`BEST ${best}`, W - 3, 0, C.light, { align: "right" });

      // 下方技能列：能量條＋汪汪按鈕
      g.rect(0, BAR_Y, W, H - BAR_Y, "rgba(16,19,31,0.85)");
      g.text("汪汪能量", 4, BAR_Y + 1, C.light);
      g.rect(56, BAR_Y + 5, 130, 6, C.ink);
      const full = energy >= BARK_NEED;
      g.rect(57, BAR_Y + 6, Math.round(128 * energy / BARK_NEED), 4, full && Math.floor(t * 6) % 2 ? C.white : C.yellow);
      for (let k = 1; k < BARK_NEED; k++) g.rect(56 + Math.round(130 * k / BARK_NEED), BAR_Y + 5, 1, 6, "#10131f");
      const bx = W - 62;
      g.rect(bx, BAR_Y + 1, 60, 14, full ? C.yellow : C.gray);
      g.rect(bx + 1, BAR_Y + 2, 58, 12, full ? C.orange : "#3a3550");
      g.text(full ? "汪！" : `${energy}/${BARK_NEED}`, bx + 30, BAR_Y + 1, full ? C.white : C.light, { align: "center" });

      if (flash > 0) g.rect(0, 0, W, H, "rgba(255,241,232,0.5)");
      if (dog.hurt > 0.4) g.rect(0, 0, W, H, "rgba(255,0,77,0.15)");
      ctx.restore();

      // 第一段的教學
      if (state === "play" && dist < 220) {
        g.rect(W - 120, 18, 116, 26, "rgba(16,19,31,0.8)");
        g.text("點上面／下面換路", W - 62, 18, C.yellow, { align: "center" });
        g.text("綠字打得贏、紅字快閃開", W - 62, 31, C.white, { align: "center", size: 10 });
      }

      // 覆蓋畫面
      const panel = (y, h) => { g.rect(28, y, W - 56, h, C.white); g.rect(30, y + 2, W - 60, h - 4, C.navy); };
      if (state === "title") {
        panel(18, 108);
        g.text("毛毛狗大冒險", W / 2, 24, C.yellow, { align: "center", size: 24, shadow: C.ink });
        g.draw(dogA, 34, 62, false, 2);
        g.text("點上面或下面換路", 152, 52, C.white, { align: "center" });
        g.text("吃骨頭、玩球數字變大", 152, 66, C.white, { align: "center" });
        g.text("比怪物大就能打倒牠", 152, 80, C.lime, { align: "center" });
        g.text("小心便便和洗澡", 152, 94, C.pink, { align: "center" });
        if (Math.floor(t * 2) % 2) g.text("點擊開始", W / 2, 108, C.yellow, { align: "center" });
      }
      if (state === "over") {
        panel(22, 98);
        g.text("GAME OVER", W / 2, 28, C.red, { align: "center", size: 24, shadow: C.ink });
        const sc = Math.floor(dist / 10);
        g.text(`跑了 ${sc} 公尺`, W / 2, 58, C.white, { align: "center" });
        g.text(`最高數字 ${fmt(maxPower)}　打倒 ${kills} 隻`, W / 2, 72, C.light, { align: "center" });
        g.text(sc >= best ? "NEW RECORD!" : `BEST ${best} m`, W / 2, 86, sc >= best ? C.yellow : C.light, { align: "center" });
        if (stateT > 1 && Math.floor(t * 2) % 2) g.text("點擊再玩一次", W / 2, 100, C.white, { align: "center" });
      }
    },
  };

  PX.run(document.getElementById("game"), game);
})();
