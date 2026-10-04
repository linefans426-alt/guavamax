/* 抓 Bug 大作戰 Bug Hunt */
(() => {
  const { C } = PX;
  const W = 192, H = 160;
  const COLS = 3, ROWS = 3;
  const CW = 54, CH = 38, GX = 8, GY = 6;
  const X0 = Math.round((W - (COLS * CW + (COLS - 1) * GX)) / 2);
  const Y0 = 22;
  const DURATION = 30;

  const bug = PX.sprite([
    "..K..K..",
    "...KK...",
    ".KRRRRK.",
    "KRRKKRRK",
    "KRRKKRRK",
    ".KRRRRK.",
    "K.KKKK.K",
    "K......K",
  ], { K: C.ink, R: C.red });

  const splat = PX.sprite([
    "R..R...R",
    ".R.RR.R.",
    "..RRRR..",
    "RRRRRRRR",
    ".RRRRRR.",
    "..RRRR.R",
    ".R.R..R.",
    "R...R...",
  ], { R: C.plum });

  const feature = PX.sprite([
    "KKKKKKKK",
    "KLLLLLLK",
    "KLLLLLWK",
    "KLLLLWWK",
    "KWLLWWLK",
    "KWWWWLLK",
    "KLWWLLLK",
    "KKKKKKKK",
  ], { K: C.ink, L: C.lime, W: C.white });

  const coffee = PX.sprite([
    ".W.W....",
    "..W.W...",
    "KKKKKK..",
    "KOOOOKKK",
    "KOOOOK.K",
    "KOOOOKKK",
    ".KOOK...",
    "..KK....",
  ], { K: C.ink, O: C.brown, W: C.light });

  // 鍵盤對應：QWE / ASD / ZXC，或數字鍵 7 8 9 / 4 5 6 / 1 2 3
  const KEYMAP = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];
  const NUMMAP = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

  const cellPos = (i) => ({ x: X0 + (i % COLS) * (CW + GX), y: Y0 + Math.floor(i / COLS) * (CH + GY) });

  let state, cells, score, combo, timeLeft, spawnT, best, pops, t, overT, newRecord, flash, squashed;

  const reset = () => {
    cells = Array.from({ length: 9 }, () => null);
    score = 0; combo = 0; timeLeft = DURATION; spawnT = 0.5; pops = []; t = 0; flash = 0; squashed = 0; newRecord = false;
  };

  const pop = (i, text, color) => {
    const p = cellPos(i);
    pops.push({ x: p.x + CW / 2, y: p.y + 4, text, color, life: 0.7 });
  };

  const spawn = () => {
    const empty = cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    if (!empty.length) return;
    const i = empty[Math.floor(Math.random() * empty.length)];
    const r = Math.random();
    const elapsed = DURATION - timeLeft;
    let type = "bug";
    if (r < 0.18) type = "feature";
    else if (r < 0.25 && timeLeft < 22) type = "coffee";
    const life = type === "bug" ? Math.max(0.65, 1.25 - elapsed * 0.02) : 1.3;
    cells[i] = { type, life, max: life, hit: 0 };
  };

  const whack = (i) => {
    const c = cells[i];
    if (!c || c.hit) { PX.beep(110, 0.04, "square", 0.03); return; }
    if (c.type === "bug") {
      combo += 1;
      const gain = combo >= 5 ? 2 : 1;
      score += gain; squashed += 1;
      c.hit = 0.25;
      pop(i, combo >= 5 ? `+2 x${combo}` : "+1", combo >= 5 ? C.yellow : C.white);
      PX.beep(520 + Math.min(combo, 10) * 30, 0.06);
    } else if (c.type === "feature") {
      score = Math.max(0, score - 2); combo = 0; flash = 0.25;
      cells[i] = null;
      pop(i, "別刪功能！-2", C.red);
      PX.beep(150, 0.2, "sawtooth", 0.07, -60);
    } else {
      timeLeft = Math.min(DURATION, timeLeft + 3);
      cells[i] = null;
      pop(i, "+3 秒", C.blue);
      PX.beep(880, 0.06); PX.beep(1175, 0.1);
    }
  };

  const game = {
    width: W, height: H,
    init() { reset(); state = "title"; best = PX.best("bug-hunt"); },

    update(dt, api) {
      t += dt;
      flash = Math.max(0, flash - dt);
      pops.forEach((p) => { p.y -= 16 * dt; p.life -= dt; });
      pops = pops.filter((p) => p.life > 0);

      const startPressed = api.hit(" ", "enter") || api.tapped();
      if (state === "title") {
        if (startPressed) { reset(); state = "play"; PX.beep(523, 0.08); PX.beep(784, 0.12); }
        return;
      }
      if (state === "over") {
        overT += dt;
        if (overT > 0.8 && startPressed) { reset(); state = "play"; PX.beep(523, 0.08); }
        return;
      }

      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0; state = "over"; overT = 0;
        if (score > best) { best = PX.best("bug-hunt", score); newRecord = true; }
        PX.beep(330, 0.15); PX.beep(262, 0.4, "triangle");
        return;
      }

      // 生成
      spawnT -= dt;
      if (spawnT <= 0) {
        spawn();
        const elapsed = DURATION - timeLeft;
        spawnT = Math.max(0.3, 0.8 - elapsed * 0.016) * (0.7 + Math.random() * 0.6);
      }

      // 倒數與逃跑
      cells.forEach((c, i) => {
        if (!c) return;
        if (c.hit) {
          c.hit -= dt;
          if (c.hit <= 0) cells[i] = null;
          return;
        }
        c.life -= dt;
        if (c.life <= 0) {
          if (c.type === "bug") { combo = 0; pop(i, "溜走了", C.lavender); }
          cells[i] = null;
        }
      });

      // 輸入
      if (api.tapped()) {
        const { x, y } = api.input.pointer;
        for (let i = 0; i < 9; i++) {
          const p = cellPos(i);
          if (x >= p.x && x < p.x + CW && y >= p.y && y < p.y + CH) { whack(i); break; }
        }
      }
      KEYMAP.forEach((k, i) => { if (api.hit(k) || api.hit(NUMMAP[i])) whack(i); });
    },

    draw(g) {
      g.clear(C.night);
      for (let y = 0; y < H; y += 4) g.rect(0, y, W, 1, "rgba(41,54,111,0.35)");

      // 九台螢幕
      for (let i = 0; i < 9; i++) {
        const { x, y } = cellPos(i);
        const c = cells[i];
        g.rect(x, y, CW, CH - 4, C.light);
        g.rect(x + 2, y + 2, CW - 4, CH - 8, C.navy);
        g.rect(x + CW / 2 - 4, y + CH - 4, 8, 2, C.gray);
        g.rect(x + CW / 2 - 8, y + CH - 2, 16, 2, C.gray);
        // 假的程式碼行
        for (let l = 0; l < 4; l++) {
          const w = 10 + ((i * 7 + l * 11) % 26);
          g.rect(x + 5 + (l % 2) * 4, y + 5 + l * 6, w, 2, "#29366f");
        }
        if (!c) continue;
        const cx = x + CW / 2 - 8, cy = y + (CH - 4) / 2 - 8;
        if (c.hit) { g.draw(splat, cx, cy, false, 2); continue; }
        const appear = Math.min(1, (c.max - c.life) / 0.12);
        const yOff = Math.round((1 - appear) * 6);
        const spr = c.type === "bug" ? bug : c.type === "feature" ? feature : coffee;
        g.draw(spr, cx, cy + yOff, Math.floor(t * 6) % 2 === 1 && c.type === "bug", 2);
        // 剩餘時間條
        const ratio = Math.max(0, c.life / c.max);
        g.rect(x + 4, y + CH - 9, Math.round((CW - 8) * ratio), 2, c.type === "bug" ? C.red : c.type === "feature" ? C.lime : C.orange);
      }

      pops.forEach((p) => g.text(p.text, p.x, p.y, p.color, { align: "center", shadow: C.ink }));

      // HUD
      g.text(`SCORE ${score}`, 4, 4, C.white);
      g.text(combo >= 2 ? `COMBO ${combo}` : "", W / 2, 4, C.yellow, { align: "center" });
      const tl = Math.ceil(timeLeft);
      g.text(`TIME ${tl}`, W - 4, 4, tl <= 5 && state === "play" ? C.red : C.white, { align: "right" });

      if (flash > 0) g.rect(0, 0, W, H, "rgba(255,0,77,0.2)");

      if (state === "title") {
        g.rect(14, 30, W - 28, 104, C.white); g.rect(16, 32, W - 32, 100, C.navy);
        g.text("抓 Bug 大作戰", W / 2, 38, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.draw(bug, 40, 70); g.text("點它！+1", 52, 70, C.white);
        g.draw(feature, 40, 84); g.text("別點，那是功能 -2", 52, 84, C.lime);
        g.draw(coffee, 40, 98); g.text("咖啡 +3 秒", 52, 98, C.orange);
        if (Math.floor(t * 2) % 2) g.text("點擊或按空白鍵開始", W / 2, 116, C.white, { align: "center" });
      }
      if (state === "over") {
        g.rect(14, 30, W - 28, 100, C.white); g.rect(16, 32, W - 32, 96, C.navy);
        g.text("TIME UP!", W / 2, 38, C.yellow, { align: "center", size: 24, shadow: C.ink });
        g.text(`SCORE ${score}`, W / 2, 68, C.white, { align: "center" });
        g.text(`抓到 ${squashed} 隻 Bug`, W / 2, 82, C.light, { align: "center" });
        g.text(newRecord ? "NEW RECORD!" : `BEST ${best}`, W / 2, 96, newRecord ? C.yellow : C.light, { align: "center" });
        if (overT > 0.8 && Math.floor(t * 2) % 2) g.text("點擊或按空白鍵再玩一次", W / 2, 112, C.white, { align: "center" });
      }
    },
  };

  PX.run(document.getElementById("game"), game);
})();
