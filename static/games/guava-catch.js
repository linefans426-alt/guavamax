/* 芭樂接接樂 Guava Catch */
(() => {
  const { C } = PX;
  const W = 192, H = 160;
  const GROUND = 146;

  const guava = PX.sprite([
    "...GG...",
    "..KKKK..",
    ".KDDDDK.",
    "KDPPPPDK",
    "KDPSPPDK",
    "KDPPSPDK",
    ".KDDDDK.",
    "..KKKK..",
  ], { G: C.lime, K: C.ink, D: C.green, P: C.pink, S: C.plum });

  const golden = PX.sprite([
    "...GG...",
    "..KKKK..",
    ".KDDDDK.",
    "KDPPPPDK",
    "KDPWPPDK",
    "KDPPPPDK",
    ".KDDDDK.",
    "..KKKK..",
  ], { G: C.lime, K: C.ink, D: C.orange, P: C.yellow, W: C.white });

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

  const basket = PX.sprite([
    "KK............KK",
    "KOK..........KOK",
    "KOOKKKKKKKKKKOOK",
    "KOBOBOBOBOBOBOBK",
    ".KOBOBOBOBOBOBK.",
    ".KBOBOBOBOBOBOK.",
    "..KOOOOOOOOOOK..",
    "...KKKKKKKKKK...",
  ], { K: C.ink, O: C.brown, B: C.orange });

  const heart = PX.sprite([
    ".RR.RR.",
    "RRRRRRR",
    "RRRRRRR",
    ".RRRRR.",
    "..RRR..",
    "...R...",
  ], { R: C.red });

  const heartEmpty = PX.sprite([
    ".KK.KK.",
    "K..K..K",
    "K.....K",
    ".K...K.",
    "..K.K..",
    "...K...",
  ], { K: C.lavender });

  // 樹冠：固定的像素雲朵形狀
  const canopy = [];
  for (let x = -8; x < W + 8; x += 14) {
    canopy.push({ x, y: -6 + ((x * 7) % 5), r: 12 + ((x * 13) % 4) });
  }

  const stars = Array.from({ length: 18 }, (_, i) => ({ x: (i * 53) % W, y: 28 + ((i * 37) % 70) }));

  let state, score, lives, items, pops, player, spawnT, combo, best, shake, flash, overT, newRecord, t;

  const reset = () => {
    score = 0; lives = 3; items = []; pops = []; combo = 0;
    player = { x: W / 2 - 8, vx: 0 };
    spawnT = 0.6; shake = 0; flash = 0; newRecord = false; t = 0;
  };

  const spawn = () => {
    const r = Math.random();
    const bugChance = Math.min(0.38, 0.2 + score * 0.004);
    let type = "guava";
    if (r < 0.06) type = "golden";
    else if (r < 0.06 + bugChance) type = "bug";
    const speed = Math.min(150, 42 + score * 1.3) + Math.random() * 18;
    items.push({ type, x: 4 + Math.random() * (W - 16), y: 18, vy: speed, wob: Math.random() * 6 });
  };

  const pop = (x, y, text, color) => pops.push({ x, y, text, color, life: 0.8 });

  const loseLife = () => {
    lives -= 1; combo = 0; shake = 0.25;
    PX.beep(140, 0.25, "sawtooth", 0.07, -80);
    if (lives <= 0) {
      state = "over"; overT = 0;
      if (score > best) { best = PX.best("guava-catch", score); newRecord = true; }
      PX.beep(220, 0.5, "triangle", 0.08, -160);
    }
  };

  const game = {
    width: W, height: H,
    init() { reset(); state = "title"; best = PX.best("guava-catch"); },

    update(dt, api) {
      t += dt;
      pops.forEach((p) => { p.y -= 18 * dt; p.life -= dt; });
      pops = pops.filter((p) => p.life > 0);
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);

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

      // 移動：鍵盤或拖曳
      const speed = 150;
      let dir = 0;
      if (api.key("ArrowLeft", "a", "A")) dir -= 1;
      if (api.key("ArrowRight", "d", "D")) dir += 1;
      if (dir) {
        player.x += dir * speed * dt;
      } else if (api.input.pointer.down) {
        const target = api.input.pointer.x - 8;
        player.x += Math.max(-speed * 1.6 * dt, Math.min(speed * 1.6 * dt, target - player.x));
      }
      player.x = Math.max(0, Math.min(W - 16, player.x));

      // 生成
      spawnT -= dt;
      if (spawnT <= 0) {
        spawn();
        spawnT = Math.max(0.32, 1.05 - score * 0.012) * (0.7 + Math.random() * 0.6);
      }

      // 落下與碰撞
      const by = GROUND - 8;
      for (const it of items) {
        it.y += it.vy * dt;
        const caught = it.y + 8 >= by && it.y + 4 <= by + 4 && it.x + 6 >= player.x + 1 && it.x + 2 <= player.x + 15;
        if (caught) {
          it.dead = true;
          if (it.type === "bug") {
            pop(it.x, by - 8, "OUCH", C.red);
            loseLife();
          } else {
            combo += 1;
            let gain = it.type === "golden" ? 5 : 1;
            if (combo > 0 && combo % 10 === 0) { gain += 3; pop(player.x, by - 20, `COMBO ${combo}!`, C.yellow); }
            score += gain;
            if (it.type === "golden") flash = 0.2;
            pop(it.x, by - 10, `+${gain}`, it.type === "golden" ? C.yellow : C.white);
            PX.beep(it.type === "golden" ? 988 : 660 + Math.min(combo, 12) * 20, 0.07);
          }
        } else if (it.y > GROUND) {
          it.dead = true;
          if (it.type !== "bug") { pop(it.x, GROUND - 10, "MISS", C.lavender); loseLife(); }
        }
        if (state !== "play") break;
      }
      items = items.filter((it) => !it.dead);
    },

    draw(g) {
      const ox = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
      g.ctx.save();
      g.ctx.translate(ox, 0);

      // 夜空、星星、樹冠、地面
      g.clear(C.night);
      stars.forEach((s, i) => { if ((Math.floor(t * 2) + i) % 7) g.rect(s.x, s.y, 1, 1, C.lavender); });
      canopy.forEach((c) => {
        g.ctx.fillStyle = C.green;
        g.ctx.fillRect(c.x - c.r, c.y, c.r * 2, c.r + 6);
        g.ctx.fillRect(c.x - c.r + 3, c.y + c.r + 6, c.r * 2 - 6, 3);
      });
      for (let x = 0; x < W; x += 6) g.rect(x, 18 + ((x / 6) % 2) * 2, 4, 2, "#0b5e3b");
      g.rect(0, GROUND, W, H - GROUND, "#0b5e3b");
      for (let x = 0; x < W; x += 4) g.rect(x, GROUND, 2, 2, C.green);

      // 物件
      items.forEach((it) => {
        const sx = it.x + Math.sin(t * 6 + it.wob) * (it.type === "bug" ? 1.5 : 0);
        g.draw(it.type === "bug" ? bug : it.type === "golden" ? golden : guava, sx, it.y);
      });
      if (state !== "title") g.draw(basket, player.x, GROUND - 8);

      pops.forEach((p) => g.text(p.text, p.x, p.y, p.color, { shadow: C.ink }));

      // HUD
      g.rect(0, 0, W, 14, "rgba(16,19,31,0.8)");
      g.text(`SCORE ${score}`, 4, 1, C.white);
      g.text(`BEST ${Math.max(best, state === "play" ? 0 : score)}`, W / 2, 1, C.light, { align: "center" });
      for (let i = 0; i < 3; i++) g.draw(i < lives ? heart : heartEmpty, W - 26 + i * 8, 4);

      if (flash > 0) g.rect(0, 0, W, H, "rgba(255,236,39,0.18)");
      g.ctx.restore();

      // 標題與結束畫面
      if (state === "title") {
        g.rect(16, 40, W - 32, 82, C.white); g.rect(18, 42, W - 36, 78, C.navy);
        g.text("芭樂接接樂", W / 2, 48, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.draw(guava, 38, 80); g.text("+1", 49, 78, C.white);
        g.draw(golden, 82, 80); g.text("+5", 93, 78, C.yellow);
        g.draw(bug, 126, 80); g.text("-", 137, 78, C.red); g.draw(heart, 143, 81);
        if (Math.floor(t * 2) % 2) g.text("點擊或按空白鍵開始", W / 2, 100, C.white, { align: "center" });
      }
      if (state === "over") {
        g.rect(16, 36, W - 32, 90, C.white); g.rect(18, 38, W - 36, 86, C.navy);
        g.text("GAME OVER", W / 2, 44, C.red, { align: "center", size: 24, shadow: C.ink });
        g.text(`SCORE ${score}`, W / 2, 74, C.white, { align: "center" });
        g.text(newRecord ? "NEW RECORD!" : `BEST ${best}`, W / 2, 90, newRecord ? C.yellow : C.light, { align: "center" });
        if (overT > 0.8 && Math.floor(t * 2) % 2) g.text("點擊或按空白鍵再玩一次", W / 2, 108, C.white, { align: "center" });
      }
    },
  };

  PX.run(document.getElementById("game"), game);
})();
