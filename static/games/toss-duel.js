/* 芭樂可頌大對決 Guava vs Croissant */
(() => {
  const { C } = PX;
  const W = 256, H = 144;

  // ── 版面與物理 ──
  const HUD_H = 28;
  const GROUND = 124;
  const WALL_X = 124, WALL_W = 8;
  const GRAV = 120;          // 重力（px/s²）
  const WIND_K = 6;          // 每 1 級風的水平加速度
  const V_MAX = 185;         // 力道 100% 時的出手速度
  const PULL_MAX = 52;       // 拖曳多長算滿力
  const HP_MAX = 100;

  // ── 像素圖（依兩張 Q 版人物畫成像素） ──
  const boyColors = {
    H: "#16121f", S: C.peach, K: C.ink, R: C.pink, N: C.navy,
    G: "#4f7a6a", W: C.white, D: C.gray,
  };
  const boyIdle = PX.sprite([
    ".....H.H..H.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HSSSSSSSSH...",
    "..SSKKSSSSKKSS..",
    "..SSSKSSSSKSSS..",
    "..SSRSSSSSSRSS..",
    "...SSSSKKSSSS...",
    "....SSSSSSSS....",
    ".....NNNNNN.....",
    "...SNNNNNNNNS...",
    "..SSNNNNNNNNSS..",
    "..SSNNNNNNNNSS..",
    "...SNNNNNNNNS...",
    "....NNNNNNNN....",
    "....GGGGGGGG....",
    "....GGGGGGGG....",
    "....GGG..GGG....",
    ".....SS..SS.....",
    "....DWW..WWD....",
    "....WWW..WWW....",
  ], boyColors);
  const boyThrow = PX.sprite([
    ".....H.H..H.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH..S",
    "...HSSSSSSSSH.SS",
    "..SSKKSSSSKKSSS.",
    "..SSSKSSSSKSSS..",
    "..SSRSSSSSSRSS..",
    "...SSSSKKSSSSS..",
    "....SSSSSSSSS...",
    ".....NNNNNNS....",
    "...SNNNNNNNN....",
    "..SSNNNNNNNN....",
    "..SSNNNNNNNN....",
    "...SNNNNNNNN....",
    "....NNNNNNNN....",
    "....GGGGGGGG....",
    "....GGGGGGGG....",
    "....GGG..GGG....",
    ".....SS..SS.....",
    "....DWW..WWD....",
    "....WWW..WWW....",
  ], boyColors);

  const girlColors = {
    H: "#16121f", S: C.peach, K: C.ink, R: C.pink, Y: "#d8b060",
    C: "#f4e8d0", B: C.brown, W: C.white, P: C.ink, L: C.light,
  };
  const girlIdle = PX.sprite([
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHSSSSSSHH...",
    "..HHYYYYYYYYHH..",
    "..HHYKSYYSKYHH..",
    "..HHYYYSSYYYHH..",
    "..HHSRSSSSRSHH..",
    "..HHSSSKKSSSHH..",
    "..HH.SSSSSS.HH..",
    "..HHCCCCCCCCHH..",
    "..HHCBWWWWCBHH..",
    "..HHCWKWWKWCHH..",
    "..HHSWWKKWWSHH..",
    "...HCCWWWWBCH...",
    "....CBCCCCBC....",
    "....PPPPPPPP....",
    "....PPP..PPP....",
    ".....SS..SS.....",
    "....LLL..LLL....",
    "....LLL..LLL....",
  ], girlColors);
  const girlThrow = PX.sprite([
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "S..HHHHHHHHHH...",
    "SS.HHSSSSSSHH...",
    ".SHHYYYYYYYYHH..",
    "..SHYKSYYSKYHH..",
    "..HSYYYSSYYYHH..",
    "..HHSRSSSSRSHH..",
    "..HHSSSKKSSSHH..",
    "..HH.SSSSSS.HH..",
    "..HHCCCCCCCCHH..",
    "..HHCBWWWWCBHH..",
    "..HHCWKWWKWCHH..",
    "..HHCWWKKWWSHH..",
    "...HCCWWWWBCH...",
    "....CBCCCCBC....",
    "....PPPPPPPP....",
    "....PPP..PPP....",
    ".....SS..SS.....",
    "....LLL..LLL....",
    "....LLL..LLL....",
  ], girlColors);

  const guavaSpr = PX.sprite([
    "..G...",
    ".KKKK.",
    "KLLLLK",
    "KLPPLK",
    "KLPPLK",
    ".KKKK.",
  ], { K: C.ink, L: C.lime, P: C.pink, G: C.green });
  const croissantSpr = PX.sprite([
    "..OOO..",
    ".OBOBO.",
    "OBOBOBO",
    "OO...OO",
    "O.....O",
  ], { O: C.orange, B: C.brown });

  // ── 隊伍與道具 ──
  const TEAMS = [
    { name: "芭樂隊", idle: boyIdle, throw: boyThrow, ammo: guavaSpr, color: C.lime, x: 26 },
    { name: "可頌隊", idle: girlIdle, throw: girlThrow, ammo: croissantSpr, color: C.orange, x: 230 },
  ];
  const ITEMS = [
    { key: "double", label: "雙", name: "雙重投擲", tip: "這回合連丟兩顆" },
    { key: "big", label: "巨", name: "巨大化", tip: "威力和爆炸範圍變大" },
    { key: "calm", label: "無", name: "無風", tip: "這一丟不受風影響" },
    { key: "heal", label: "補", name: "補血", tip: "立刻回復 25 HP" },
  ];

  // ── 狀態 ──
  let state, t, stateT, mode, human; // mode: 1p / 2p；human[i]：該隊是否由玩家控制
  let players, turn, wind, wallTop, shots, splashes, clouds, msg, msgT;
  let aim, kbAngle, kbPower, kbDir, charging, used, pending, aiPlan, aiSkill, winner, prevDown;

  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const say = (s, life = 1.6) => { msg = s; msgT = life; };
  const facing = (i) => (i === 0 ? 1 : -1);
  const handPos = (i) => [TEAMS[i].x + facing(i) * 12, GROUND - 34];

  const reset = (m) => {
    mode = m;
    human = m === "2p" ? [true, true] : m === "1p-girl" ? [false, true] : [true, false];
    players = TEAMS.map(() => ({ hp: HP_MAX, items: { double: true, big: true, calm: true, heal: true }, hurt: 0, throwT: 0 }));
    wallTop = Math.round(rand(GROUND - 52, GROUND - 32));
    shots = []; splashes = [];
    clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 60 + rand(0, 30), y: rand(34, 64), w: rand(14, 26) }));
    aiSkill = [0, 0];
    winner = -1;
    turn = Math.random() < 0.5 ? 0 : 1;
    startTurn();
  };

  const startTurn = () => {
    state = "aim"; stateT = 0;
    // 風向：-5～5，越接近 0 機率越高
    wind = Math.round(gauss() * 5.5);
    wind = Math.max(-5, Math.min(5, wind));
    used = null;
    aim = null;
    kbAngle = 45; kbPower = 0; kbDir = 1; charging = false;
    aiPlan = null;
    say(`${TEAMS[turn].name}的回合`, 1.4);
  };

  // ── 物理：同一個函式給遊戲和電腦模擬共用 ──
  const step = (p, dt, w) => {
    p.vx += w * WIND_K * dt;
    p.vy += GRAV * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.age += dt;
  };
  const hitBody = (p, i) => {
    const x = TEAMS[i].x;
    return p.x + p.r > x - 12 && p.x - p.r < x + 12 && p.y + p.r > GROUND - 40 && p.y - p.r < GROUND;
  };
  // 回傳撞到什麼：'body0'、'body1'、'wall'、'ground'、'out' 或 null（還在飛）
  const collide = (p) => {
    for (let i = 0; i < 2; i++) {
      if (i === p.owner && p.age < 0.3) continue;
      if (hitBody(p, i)) return "body" + i;
    }
    if (p.x + p.r > WALL_X && p.x - p.r < WALL_X + WALL_W && p.y + p.r > wallTop) return "wall";
    if (p.y + p.r >= GROUND) return "ground";
    if (p.x < -30 || p.x > W + 30) return "out";
    return null;
  };

  const makeShot = (owner, angleDeg, power, opts) => {
    const [hx, hy] = handPos(owner);
    const a = (angleDeg * Math.PI) / 180;
    const v = power * V_MAX;
    return {
      owner, x: hx, y: hy, vx: Math.cos(a) * v * facing(owner), vy: -Math.sin(a) * v,
      age: 0, r: opts.big ? 8 : 5, big: !!opts.big, calm: !!opts.calm, trail: [],
    };
  };

  // 電腦：把各種角度、力道都模擬一次，挑最接近對手的那一組
  const simulate = (owner, angle, power, opts) => {
    const p = makeShot(owner, angle, power, opts);
    const w = opts.calm ? 0 : wind;
    for (let k = 0; k < 600; k++) {
      step(p, 1 / 60, w);
      const c = collide(p);
      if (c) return { x: c === "out" ? (p.x < 0 ? -999 : 999) : p.x, c };
    }
    return { x: 999, c: "out" };
  };

  const planAI = () => {
    const me = turn, foe = 1 - turn, p = players[me];
    // 道具判斷
    let item = null;
    if (p.items.heal && p.hp <= 45) item = "heal";
    else if (p.items.calm && Math.abs(wind) >= 4) item = "calm";
    else if (p.items.big && players[foe].hp <= 45) item = "big";
    else if (p.items.double && Math.random() < 0.25) item = "double";
    const opts = { big: item === "big", calm: item === "calm" };
    const tx = TEAMS[foe].x;
    let best = null;
    for (let a = 20; a <= 80; a += 1) {
      for (let pw = 0.3; pw <= 1.001; pw += 0.02) {
        const r = simulate(me, a, pw, opts);
        const d = r.c === "body" + foe ? 0 : Math.abs(r.x - tx);
        if (!best || d < best.d) best = { a, pw, d };
      }
    }
    // 加一點誤差，越打越準
    const err = Math.max(1.4, 4.5 - aiSkill[me] * 0.6);
    const angle = Math.max(10, Math.min(85, best.a + gauss() * err * 1.2));
    const power = Math.max(0.25, Math.min(1, best.pw + gauss() * err * 0.012));
    aiSkill[me]++;
    return { item, angle, power, at: 1.2 };
  };

  const useItem = (key) => {
    const p = players[turn];
    if (!p.items[key]) return;
    if (key === "heal") {
      p.items.heal = false;
      p.hp = Math.min(HP_MAX, p.hp + 25);
      splashes.push({ x: TEAMS[turn].x, y: GROUND - 56, life: 0.8, heal: true });
      say("補血 +25", 1.2);
      PX.beep(660, 0.08); PX.beep(990, 0.12);
      return;
    }
    if (used === key) { used = null; return; } // 再按一次取消
    used = key;
    const it = ITEMS.find((i) => i.key === key);
    say(`${it.name}：${it.tip}`, 1.6);
    PX.beep(880, 0.06);
  };

  const throwNow = (angle, power) => {
    const opts = { big: used === "big", calm: used === "calm" };
    if (used) players[turn].items[used] = false;
    const count = used === "double" ? 2 : 1;
    pending = [];
    for (let k = 0; k < count; k++) pending.push({ at: k * 0.45, shot: makeShot(turn, angle, power, opts) });
    players[turn].throwT = 0.35;
    state = "fly"; stateT = 0;
    PX.beep(420, 0.08, "triangle", 0.06, 300);
  };

  // 直接命中拿滿傷害；落在附近則依距離遞減（自己也會被波及）
  const damageAt = (x, y, big, owner, direct) => {
    const R = big ? 40 : 28, MAX = big ? 45 : 30;
    for (let i = 0; i < 2; i++) {
      const cx = TEAMS[i].x, cy = GROUND - 20;
      const d = Math.hypot(x - cx, y - cy);
      if (i !== direct && d >= R) continue;
      const dmg = i === direct ? MAX : Math.max(3, Math.round(MAX * 0.8 * (1 - d / R)));
      players[i].hp = Math.max(0, players[i].hp - dmg);
      players[i].hurt = 0.5;
      splashes.push({ x: cx, y: GROUND - 56, life: 1, text: `-${dmg}`, color: i === owner ? C.light : C.red });
    }
  };

  const explode = (p, c) => {
    if (c === "out") return;
    const n = p.big ? 16 : 10;
    const col = p.owner === 0 ? [C.lime, C.pink] : [C.orange, C.yellow];
    for (let k = 0; k < n; k++) {
      splashes.push({ x: p.x, y: Math.min(p.y, GROUND - 1), vx: rand(-50, 50), vy: rand(-80, -20), life: rand(0.4, 0.8), dot: true, color: col[k % 2] });
    }
    damageAt(p.x, p.y, p.big, p.owner, c.startsWith("body") ? Number(c[4]) : -1);
    PX.beep(c.startsWith("body") ? 180 : 140, 0.18, "square", 0.06, -60);
  };

  // ── 主迴圈 ──
  const game = {
    width: W, height: H,
    init() { t = 0; state = "title"; stateT = 0; prevDown = false; msgT = 0; reset("1p"); state = "title"; },

    update(dt, api) {
      t += dt; stateT += dt;
      msgT = Math.max(0, msgT - dt);
      const p = api.input.pointer;
      const tapped = api.tapped();
      const released = prevDown && !p.down;
      prevDown = p.down;

      clouds.forEach((c) => { c.x += (wind * 4 + 2) * dt; if (c.x > W + 30) c.x = -30; if (c.x < -30) c.x = W + 30; });
      splashes.forEach((s) => {
        s.life -= dt;
        if (s.dot) { s.vy += GRAV * dt; s.x += s.vx * dt; s.y += s.vy * dt; } else s.y -= 12 * dt;
      });
      splashes = splashes.filter((s) => s.life > 0);
      players.forEach((pl) => { pl.hurt = Math.max(0, pl.hurt - dt); pl.throwT = Math.max(0, pl.throwT - dt); });

      if (state === "title") {
        // 三個按鈕：1P 芭樂隊 / 1P 可頌隊 / 2P 對戰
        let pick = null;
        if (api.hit("1")) pick = "1p";
        if (api.hit("2")) pick = "1p-girl";
        if (api.hit("3")) pick = "2p";
        if (tapped && p.y > 78 && p.y < 112) pick = p.x < 88 ? "1p" : p.x < 168 ? "1p-girl" : "2p";
        if (pick) { reset(pick); PX.beep(523, 0.08); PX.beep(784, 0.12); }
        return;
      }
      if (state === "over") {
        if (stateT > 1 && (tapped || api.hit(" ", "enter"))) { state = "title"; stateT = 0; }
        return;
      }

      if (state === "aim") {
        const me = turn;
        if (human[me]) {
          // 道具按鈕
          const bx0 = me === 0 ? 2 : W - 64;
          let onButton = false;
          if (tapped && p.y >= 13 && p.y <= 26 && p.x >= bx0 && p.x <= bx0 + 62) {
            onButton = true;
            const idx = Math.floor((p.x - bx0) / 16);
            if (ITEMS[idx]) useItem(ITEMS[idx].key);
          }
          ["1", "2", "3", "4"].forEach((k, i) => { if (api.hit(k)) useItem(ITEMS[i].key); });

          // 彈弓式瞄準：按住往後拉，放開就丟
          if (tapped && !onButton && p.y > HUD_H) aim = { sx: p.x, sy: p.y, angle: 45, power: 0 };
          if (aim && p.down) {
            const dx = (aim.sx - p.x) * facing(me), dy = aim.sy - p.y;
            const len = Math.hypot(dx, dy);
            aim.power = Math.min(1, len / PULL_MAX);
            let ang = (Math.atan2(-dy, dx) * 180) / Math.PI;
            aim.angle = Math.max(0, Math.min(90, ang));
          }
          if (aim && released) {
            if (aim.power > 0.1) throwNow(aim.angle, aim.power);
            aim = null;
          }

          // 鍵盤：↑↓ 調角度，按住空白鍵蓄力
          if (api.key("ArrowUp", "w", "W")) kbAngle = Math.min(90, kbAngle + 40 * dt);
          if (api.key("ArrowDown", "s", "S")) kbAngle = Math.max(0, kbAngle - 40 * dt);
          if (api.key(" ")) {
            charging = true;
            kbPower += kbDir * 0.9 * dt;
            if (kbPower >= 1) { kbPower = 1; kbDir = -1; }
            if (kbPower <= 0) { kbPower = 0; kbDir = 1; }
          } else if (charging) {
            charging = false;
            if (kbPower > 0.05) throwNow(kbAngle, kbPower);
            kbPower = 0; kbDir = 1;
          }
        } else {
          // 電腦回合
          if (!aiPlan && stateT > 0.6) {
            aiPlan = planAI();
            if (aiPlan.item) useItem(aiPlan.item);
          }
          if (aiPlan && stateT > aiPlan.at) {
            const k = Math.min(1, (stateT - aiPlan.at) / 0.8);
            aim = { angle: aiPlan.angle, power: aiPlan.power * k, ai: true };
            if (k >= 1 && stateT > aiPlan.at + 1.1) { aim = null; throwNow(aiPlan.angle, aiPlan.power); }
          }
        }
        return;
      }

      if (state === "fly") {
        for (const pd of pending) {
          if (pd.at !== null && stateT >= pd.at) { shots.push(pd.shot); pd.at = null; if (pd !== pending[0]) players[turn].throwT = 0.35; }
        }
        for (const s of shots) {
          const w = s.calm ? 0 : wind;
          for (let k = 0; k < 2; k++) {
            step(s, dt / 2, w);
            const c = collide(s);
            if (c) { s.dead = true; explode(s, c); break; }
          }
          s.trail.push([s.x, s.y]);
          if (s.trail.length > 14) s.trail.shift();
        }
        shots = shots.filter((s) => !s.dead);
        if (shots.length === 0 && pending.every((pd) => pd.at === null)) {
          state = "settle"; stateT = 0;
        }
        return;
      }

      if (state === "settle" && stateT > 0.9) {
        const dead = players.map((pl) => pl.hp <= 0);
        if (dead[0] || dead[1]) {
          winner = dead[0] && dead[1] ? 1 - turn : dead[0] ? 1 : 0;
          state = "over"; stateT = 0;
          PX.beep(523, 0.1); PX.beep(659, 0.1); PX.beep(784, 0.2);
          return;
        }
        turn = 1 - turn;
        startTurn();
      }
    },

    draw(g) {
      const ctx = g.ctx;
      // 天空
      const sky = ["#29adff", "#4dbbff", "#71c8ff", "#95d5ff", "#b9e2ff"];
      sky.forEach((c, i) => g.rect(0, i * 25, W, 26, c));
      g.rect(0, 0, W, HUD_H, "rgba(16,19,31,0.85)");
      clouds.forEach((c) => {
        g.rect(c.x, c.y, c.w, 5, C.white);
        g.rect(c.x + 3, c.y - 3, c.w - 8, 3, C.white);
      });

      // 遠山與地面
      for (let x = 0; x < W; x += 2) {
        const hgt = 10 + Math.sin(x * 0.04) * 6 + Math.sin(x * 0.11) * 3;
        g.rect(x, GROUND - hgt, 2, hgt, "#6fbf73");
      }
      g.rect(0, GROUND, W, H - GROUND, "#8a5a3a");
      g.rect(0, GROUND, W, 3, C.lime);
      for (let x = 0; x < W; x += 6) g.rect(x + 2, GROUND + 6 + (x % 12 ? 0 : 5), 2, 1, "#6a4028");

      // 中間的牆
      g.rect(WALL_X, wallTop, WALL_W, GROUND - wallTop, C.gray);
      for (let y = wallTop; y < GROUND; y += 4) {
        g.rect(WALL_X, y, WALL_W, 1, "#3f3a35");
        g.rect(WALL_X + ((y / 4) % 2 ? 4 : 0), y, 1, 4, "#3f3a35");
      }
      g.rect(WALL_X - 1, wallTop - 1, WALL_W + 2, 2, C.light);

      // 角色
      TEAMS.forEach((tm, i) => {
        const pl = players[i];
        const spr = pl.throwT > 0 ? tm.throw : tm.idle;
        const bob = state === "aim" && turn === i ? Math.round(Math.sin(t * 6)) : 0;
        const shakeX = pl.hurt > 0 ? Math.round(Math.sin(t * 60)) : 0;
        g.draw(spr, tm.x - 16 + shakeX, GROUND - 42 + bob, i === 1, 2);
        if (pl.hurt > 0) g.rect(tm.x - 12, GROUND - 42, 24, 42, "rgba(255,0,77,0.25)");
        if (state === "aim" && turn === i) {
          const ay = GROUND - 52 + Math.round(Math.sin(t * 6) * 1.5);
          g.rect(tm.x - 2, ay, 5, 2, C.yellow); g.rect(tm.x - 1, ay + 2, 3, 1, C.yellow); g.rect(tm.x, ay + 3, 1, 1, C.yellow);
        }
      });

      // 瞄準輔助線（只畫方向和力道，不畫完整拋物線）
      const showAim = state === "aim" && (aim || charging || (human[turn] && !aim));
      if (showAim) {
        const a = aim ? aim.angle : kbAngle;
        const pw = aim ? aim.power : kbPower;
        const [hx, hy] = handPos(turn);
        const rad = (a * Math.PI) / 180;
        const len = 8 + pw * 34;
        const dots = aim || charging ? 7 : 3;
        for (let k = 1; k <= dots; k++) {
          const d = (len * k) / dots;
          g.rect(hx + Math.cos(rad) * d * facing(turn) - 1, hy - Math.sin(rad) * d - 1, 2, 2, k === dots ? C.yellow : C.white);
        }
        if (aim || charging) {
          const tx = turn === 0 ? 40 : W - 120;
          g.rect(tx, HUD_H + 3, 80, 13, "rgba(16,19,31,0.75)");
          g.text(`力${Math.round(pw * 100)} 角${Math.round(a)}°`, tx + 40, HUD_H + 2, C.white, { align: "center" });
          g.rect(tx + 4, HUD_H + 14, 72, 2, C.ink);
          g.rect(tx + 4, HUD_H + 14, Math.round(72 * pw), 2, pw > 0.85 ? C.red : C.yellow);
        }
      }

      // 投擲物
      for (const s of shots) {
        s.trail.forEach(([x, y], k) => { if (k % 2 === 0) g.rect(x, y, 1, 1, "rgba(255,241,232,0.7)"); });
        const spr = TEAMS[s.owner].ammo;
        const sc = s.big ? 3 : 2;
        const rot = Math.floor(s.age * 10) % 2 === 0;
        g.draw(spr, s.x - (spr.width * sc) / 2, s.y - (spr.height * sc) / 2, rot, sc);
        if (s.y < HUD_H) { // 飛出畫面上方時的位置提示
          g.rect(s.x - 2, HUD_H + 1, 5, 2, C.yellow); g.rect(s.x - 1, HUD_H + 3, 3, 1, C.yellow);
        }
      }

      // 爆開的果汁、扣血數字
      splashes.forEach((s) => {
        if (s.dot) g.rect(s.x, s.y, 2, 2, s.color);
        else if (s.heal) g.text("+25", s.x, s.y, C.lime, { align: "center", shadow: C.ink });
        else g.text(s.text, s.x, s.y, s.color, { align: "center", shadow: C.ink });
      });

      // HUD：血量
      TEAMS.forEach((tm, i) => {
        const pl = players[i];
        const left = i === 0;
        g.text(tm.name, left ? 2 : W - 2, -1, tm.color, { align: left ? "left" : "right" });
        const bx = left ? 38 : W - 94;
        g.rect(bx, 3, 54, 6, C.ink);
        const w = Math.round((52 * pl.hp) / HP_MAX);
        g.rect(left ? bx + 1 : bx + 53 - w, 4, w, 4, pl.hp > 50 ? C.lime : pl.hp > 25 ? C.yellow : C.red);
        // 道具按鈕
        const bx0 = left ? 2 : W - 64;
        ITEMS.forEach((it, k) => {
          const x = bx0 + k * 16, y = 14;
          const have = pl.items[it.key];
          const sel = used === it.key && turn === i;
          g.rect(x, y, 14, 12, sel ? C.yellow : have ? (turn === i ? C.light : C.gray) : "#2a2535");
          g.rect(x + 1, y + 1, 12, 10, sel ? C.orange : have ? C.navy : "#1a1626");
          g.text(it.label, x + 7, y - 1, have ? C.white : C.gray, { align: "center" });
        });
      });

      // 風向：風字 + 五格強度 + 方向箭頭
      const n = Math.abs(wind);
      g.text("風", 96, -1, C.white);
      for (let k = 0; k < 5; k++) {
        g.rect(110 + k * 5, 4, 4, 5, k < n ? (n >= 4 ? C.red : C.yellow) : "#3a3550");
      }
      g.text(n ? `${wind > 0 ? "→" : "←"}${n}` : "無", 137, -1, n >= 4 ? C.red : C.white);
      g.text(TEAMS[turn].name + (human[turn] ? "" : "（電腦）"), W / 2, 14, TEAMS[turn].color, { align: "center" });

      if (msgT > 0 && state !== "title") {
        g.rect(W / 2 - 70, 46, 140, 15, "rgba(16,19,31,0.75)");
        g.text(msg, W / 2, 47, C.white, { align: "center" });
      }

      // 覆蓋畫面
      if (state === "title") {
        g.rect(0, 0, W, H, C.navy);
        g.rect(0, GROUND, W, H - GROUND, "#8a5a3a");
        g.rect(0, GROUND, W, 3, C.lime);
        g.text("芭樂可頌大對決", W / 2, 8, C.yellow, { align: "center", size: 24, shadow: C.ink });
        g.text("按住往後拉、放開就丟", W / 2, 40, C.white, { align: "center" });
        g.text("注意風向，越過中間的牆", W / 2, 54, C.white, { align: "center" });
        g.draw(boyIdle, 6, 34, false, 2);
        g.draw(girlIdle, W - 38, 34, true, 2);
        const btn = (x, label, sub, col) => {
          g.rect(x, 80, 76, 30, C.white);
          g.rect(x + 1, 81, 74, 28, col);
          g.text(label, x + 38, 81, C.ink, { align: "center" });
          g.text(sub, x + 38, 95, C.ink, { align: "center" });
        };
        btn(8, "1P 單人", "玩芭樂隊", C.lime);
        btn(90, "1P 單人", "玩可頌隊", C.orange);
        btn(172, "2P 對戰", "同台輪流", C.pink);
        g.text("鍵盤：按 1／2／3 選擇", W / 2, 111, C.light, { align: "center" });
      }
      if (state === "over") {
        g.rect(40, 40, W - 80, 64, C.white);
        g.rect(42, 42, W - 84, 60, C.navy);
        g.text(`${TEAMS[winner].name} 獲勝！`, W / 2, 48, TEAMS[winner].color, { align: "center", size: 24, shadow: C.ink });
        let sub = "";
        if (mode !== "2p") sub = human[winner] ? "你打贏電腦了！" : "電腦贏了，再來一局？";
        g.text(sub, W / 2, 74, C.white, { align: "center" });
        if (stateT > 1 && Math.floor(t * 2) % 2) g.text("點擊回到選單", W / 2, 88, C.light, { align: "center" });
      }
    },
  };

  PX.run(document.getElementById("game"), game);
})();
