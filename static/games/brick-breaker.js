/* 打磚塊：敲碎技術債 Brick Breaker */
(() => {
  const { C } = PX;
  const W = 192, H = 160;
  const TOP = 14;
  const COLS = 12, BW = 14, BH = 6, GAP = 2;
  const BX0 = Math.round((W - (COLS * BW + (COLS - 1) * GAP)) / 2);
  const BY0 = 22;
  const PADDLE_Y = 148, PADDLE_H = 4;
  const BALL = 3;
  const MAX_BALLS = 9;
  const ROW_COLORS = [C.red, C.orange, C.yellow, C.lime, C.blue, C.pink];

  // 關卡：數字代表要敲幾下，. 代表空格
  const LEVELS = [
    ["222222222222", "111111111111", "111111111111", "111111111111", "111111111111"],
    ["....2222....", "...222222...", "..11111111..", ".1111111111.", "111111111111", "2.2.2..2.2.2"],
    ["333..33..333", "222222222222", "1.1.1.1.1.1.", ".1.1.1.1.1.1", "222222222222", "111111111111"],
    ["1..1..1..1..", "22.22.22.22.", "333333333333", ".22.22.22.22", "..1..1..1..1", "111111111111"],
  ];

  // 道具：迷你 3×5 像素字
  const glyph = (rows) => PX.sprite(rows, { W: C.white });
  const POWERS = {
    M: { color: C.blue, label: "分裂球", icon: glyph(["W.W", "WWW", "WWW", "W.W", "W.W"]) },
    L: { color: C.green, label: "板子加長", icon: glyph(["W..", "W..", "W..", "W..", "WWW"]) },
    S: { color: C.red, label: "板子縮短", icon: glyph([".WW", "W..", ".W.", "..W", "WW."]) },
    T: { color: C.orange, label: "球變慢", icon: glyph(["WWW", ".W.", ".W.", ".W.", ".W."]) },
    H: { color: C.pink, label: "生命 +1", icon: glyph(["...", ".W.", "WWW", ".W.", "..."]) },
  };
  const POWER_TABLE = ["M", "M", "M", "L", "L", "S", "S", "T", "H"];

  const heart = PX.sprite([".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."], { R: C.red });
  const heartEmpty = PX.sprite([".KK.KK.", "K..K..K", "K.....K", ".K...K.", "..K.K..", "...K..."], { K: C.lavender });

  let state, level, score, lives, bricks, balls, caps, pops, paddle, effects, best, t, stateT, newRecord, lastPointerX, flash;

  const resetEffects = () => { effects = { long: 0, short: 0, slow: 0 }; };

  const paddleWidth = () => (effects.short > 0 ? 16 : effects.long > 0 ? 44 : 28);

  const ballSpeed = () => Math.min(150, 88 + (level - 1) * 8) * (effects.slow > 0 ? 0.65 : 1);

  const buildLevel = () => {
    const layout = LEVELS[(level - 1) % LEVELS.length];
    bricks = [];
    layout.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === ".") return;
        const hp = Number(ch);
        bricks.push({ x: BX0 + c * (BW + GAP), y: BY0 + r * (BH + GAP), hp, max: hp, color: ROW_COLORS[r % ROW_COLORS.length] });
      });
    });
  };

  const serve = () => {
    balls = [{ x: 0, y: 0, vx: 0, vy: 0, stuck: true }];
    caps = [];
    resetEffects();
    paddle.w = paddleWidth();
    state = "serve";
  };

  const newGame = () => {
    level = 1; score = 0; lives = 3; pops = []; newRecord = false; flash = 0;
    paddle = { x: W / 2 - 14, w: 28 };
    resetEffects();
    buildLevel();
    serve();
  };

  const pop = (x, y, text, color) => pops.push({ x, y, text, color, life: 0.8 });

  const setVelocity = (b, angle) => {
    const s = ballSpeed();
    b.vx = s * Math.sin(angle);
    b.vy = -s * Math.cos(angle);
  };

  const launch = () => {
    balls.forEach((b) => {
      if (!b.stuck) return;
      b.stuck = false;
      setVelocity(b, (Math.random() - 0.5) * 0.6);
    });
    state = "play";
    PX.beep(440, 0.06); PX.beep(660, 0.08);
  };

  const applyPower = (type) => {
    const cx = paddle.x + paddle.w / 2;
    // 同一時間只顯示一個道具提示，避免連續接到時字疊在一起
    pops = pops.filter((p) => !p.power);
    pop(cx, PADDLE_Y - 16, POWERS[type].label, POWERS[type].color === C.red ? C.red : C.white);
    pops[pops.length - 1].power = true;
    if (type === "M") {
      const add = [];
      balls.forEach((b) => {
        if (b.stuck) return;
        const s = Math.hypot(b.vx, b.vy);
        const ang = Math.atan2(b.vx, -b.vy);
        [-0.45, 0.45].forEach((d) => {
          if (balls.length + add.length >= MAX_BALLS) return;
          add.push({ x: b.x, y: b.y, vx: s * Math.sin(ang + d), vy: -Math.abs(s * Math.cos(ang + d)), stuck: false });
        });
      });
      balls.push(...add);
      PX.beep(880, 0.06); PX.beep(1100, 0.06); PX.beep(1320, 0.08);
    } else if (type === "L") {
      effects.long = 12; effects.short = 0;
      PX.beep(523, 0.06, "square", 0.06, 300);
    } else if (type === "S") {
      effects.short = 10; effects.long = 0;
      PX.beep(400, 0.12, "sawtooth", 0.06, -200);
    } else if (type === "T") {
      effects.slow = 8;
      PX.beep(300, 0.2, "triangle", 0.08, -100);
    } else if (type === "H") {
      lives = Math.min(5, lives + 1);
      PX.beep(784, 0.08); PX.beep(1047, 0.12);
    }
  };

  const hitBrick = (br) => {
    br.hp -= 1;
    score += 10;
    if (br.hp <= 0) {
      br.dead = true;
      score += 10 * br.max;
      PX.beep(700 + Math.random() * 200, 0.05);
      if (Math.random() < 0.16) {
        const type = POWER_TABLE[Math.floor(Math.random() * POWER_TABLE.length)];
        caps.push({ x: br.x + BW / 2 - 4, y: br.y, type });
      }
    } else {
      PX.beep(380, 0.04);
    }
  };

  // 讓球維持固定速度，也避免角度太水平而一直左右彈
  const normalize = (b) => {
    const s = ballSpeed();
    let { vx, vy } = b;
    const len = Math.hypot(vx, vy) || 1;
    vx = (vx / len) * s; vy = (vy / len) * s;
    const minVy = s * 0.35;
    if (Math.abs(vy) < minVy) {
      vy = Math.sign(vy || -1) * minVy;
      vx = Math.sign(vx || 1) * Math.sqrt(Math.max(0, s * s - vy * vy));
    }
    b.vx = vx; b.vy = vy;
  };

  const stepBall = (b, dt) => {
    normalize(b);
    const dist = Math.hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 1.5));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      b.x += b.vx * sdt;
      b.y += b.vy * sdt;

      // 牆壁
      if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); PX.beep(220, 0.02); }
      if (b.x + BALL > W) { b.x = W - BALL; b.vx = -Math.abs(b.vx); PX.beep(220, 0.02); }
      if (b.y < TOP) { b.y = TOP; b.vy = Math.abs(b.vy); PX.beep(220, 0.02); }

      // 板子：依擊中位置決定反彈角度
      if (b.vy > 0 && b.y + BALL >= PADDLE_Y && b.y + BALL <= PADDLE_Y + PADDLE_H + 2 &&
          b.x + BALL > paddle.x && b.x < paddle.x + paddle.w) {
        const rel = Math.max(0, Math.min(1, (b.x + BALL / 2 - paddle.x) / paddle.w));
        b.y = PADDLE_Y - BALL;
        setVelocity(b, (rel - 0.5) * 2 * 1.05);
        PX.beep(330, 0.04);
      }

      // 磚塊
      for (const br of bricks) {
        if (br.dead) continue;
        if (b.x + BALL <= br.x || b.x >= br.x + BW || b.y + BALL <= br.y || b.y >= br.y + BH) continue;
        const ox = Math.min(br.x + BW - b.x, b.x + BALL - br.x);
        const oy = Math.min(br.y + BH - b.y, b.y + BALL - br.y);
        if (ox < oy) {
          b.vx = b.x + BALL / 2 < br.x + BW / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
        } else {
          b.vy = b.y + BALL / 2 < br.y + BH / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
        }
        hitBrick(br);
        break;
      }

      if (b.y > H) { b.lost = true; return; }
    }
  };

  const loseLife = () => {
    lives -= 1; flash = 0.3;
    PX.beep(160, 0.3, "sawtooth", 0.07, -90);
    if (lives <= 0) {
      state = "over"; stateT = 0;
      if (score > best) { best = PX.best("brick-breaker", score); newRecord = true; }
      PX.beep(220, 0.5, "triangle", 0.08, -160);
    } else {
      serve();
    }
  };

  const game = {
    width: W, height: H,
    init() { best = PX.best("brick-breaker"); t = 0; newGame(); state = "title"; lastPointerX = null; },

    update(dt, api) {
      t += dt;
      flash = Math.max(0, flash - dt);
      pops.forEach((p) => { p.y -= 16 * dt; p.life -= dt; });
      pops = pops.filter((p) => p.life > 0);

      const start = api.hit(" ", "enter", "ArrowUp", "w") || api.tapped();
      if (state === "title") { if (start) { newGame(); PX.beep(523, 0.08); PX.beep(784, 0.12); } return; }
      if (state === "over") { stateT += dt; if (stateT > 0.8 && start) { newGame(); PX.beep(523, 0.08); } return; }
      if (state === "clear") {
        stateT += dt;
        if (stateT > 1.6) { level += 1; buildLevel(); serve(); }
        return;
      }

      // 效果倒數
      ["long", "short", "slow"].forEach((k) => { effects[k] = Math.max(0, effects[k] - dt); });
      const targetW = paddleWidth();
      if (paddle.w !== targetW) {
        const cx = paddle.x + paddle.w / 2;
        paddle.w = targetW;
        paddle.x = cx - paddle.w / 2;
      }

      // 板子移動：鍵盤，或滑鼠／手指直接對準
      let dir = 0;
      if (api.key("ArrowLeft", "a", "A")) dir -= 1;
      if (api.key("ArrowRight", "d", "D")) dir += 1;
      const p = api.input.pointer;
      if (dir) {
        paddle.x += dir * 170 * dt;
      } else if (p.active && (p.down || p.x !== lastPointerX)) {
        paddle.x = p.x - paddle.w / 2;
      }
      lastPointerX = p.x;
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

      if (state === "serve") {
        balls.forEach((b) => { b.x = paddle.x + paddle.w / 2 - BALL / 2; b.y = PADDLE_Y - BALL; });
        if (start) launch();
        return;
      }

      // 球
      balls.forEach((b) => stepBall(b, dt));
      balls = balls.filter((b) => !b.lost);
      bricks = bricks.filter((br) => !br.dead);

      // 道具掉落
      caps.forEach((c) => {
        c.y += 38 * dt;
        if (c.y + 7 >= PADDLE_Y && c.y <= PADDLE_Y + PADDLE_H && c.x + 9 > paddle.x && c.x < paddle.x + paddle.w) {
          c.dead = true;
          applyPower(c.type);
        } else if (c.y > H) c.dead = true;
      });
      caps = caps.filter((c) => !c.dead);

      if (!bricks.length) {
        state = "clear"; stateT = 0; score += 100 * level;
        PX.beep(523, 0.1); PX.beep(659, 0.1); PX.beep(784, 0.1); PX.beep(1047, 0.2);
        return;
      }
      if (!balls.length) loseLife();
    },

    draw(g) {
      g.clear(C.night);
      for (let y = TOP; y < H; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < W; x += 8) g.rect(x, y, 1, 1, "#1d2240");

      // 磚塊：有亮邊和暗邊的立體感
      bricks.forEach((br) => {
        const base = br.hp >= 3 ? C.light : br.hp === 2 ? C.lavender : br.color;
        g.rect(br.x, br.y, BW, BH, base);
        g.rect(br.x, br.y, BW, 1, C.white);
        g.rect(br.x, br.y + BH - 1, BW, 1, C.ink);
        if (br.hp < br.max) g.rect(br.x + 5, br.y + 2, 3, 1, C.ink);
      });

      // 道具膠囊
      caps.forEach((c) => {
        const pw = POWERS[c.type];
        g.rect(c.x + 1, c.y, 7, 7, pw.color);
        g.rect(c.x, c.y + 1, 9, 5, pw.color);
        g.draw(pw.icon, c.x + 3, c.y + 1);
      });

      // 板子
      const pc = effects.short > 0 ? C.red : effects.long > 0 ? C.lime : C.pink;
      g.rect(paddle.x, PADDLE_Y, paddle.w, PADDLE_H, pc);
      g.rect(paddle.x, PADDLE_Y, paddle.w, 1, C.white);
      g.rect(paddle.x, PADDLE_Y, 2, PADDLE_H, C.ink);
      g.rect(paddle.x + paddle.w - 2, PADDLE_Y, 2, PADDLE_H, C.ink);

      // 球
      balls.forEach((b) => g.rect(b.x, b.y, BALL, BALL, effects.slow > 0 ? C.orange : C.white));

      pops.forEach((p) => g.text(p.text, p.x, p.y, p.color, { align: "center", shadow: C.ink }));

      // HUD
      g.rect(0, 0, W, TOP - 1, "#1d2b53");
      g.text(`SCORE ${score}`, 3, 0, C.white);
      g.text(`LV ${level}`, W / 2 + 8, 0, C.yellow, { align: "center" });
      for (let i = 0; i < Math.max(3, lives); i++) g.draw(i < lives ? heart : heartEmpty, W - 9 - i * 8, 3);

      if (state === "serve" && Math.floor(t * 2) % 2) g.text("點擊或按空白鍵發球", W / 2, 120, C.white, { align: "center", shadow: C.ink });
      if (flash > 0) g.rect(0, 0, W, H, "rgba(255,0,77,0.18)");

      if (state === "title") {
        g.rect(12, 20, W - 24, 128, C.white); g.rect(14, 22, W - 28, 124, C.navy);
        g.text("打磚塊", W / 2, 28, C.pink, { align: "center", size: 24, shadow: C.ink });
        g.text("把技術債一塊一塊敲掉", W / 2, 56, C.light, { align: "center" });
        const keys = Object.keys(POWERS);
        keys.forEach((k, i) => {
          const x = 30 + (i % 2) * 70, y = 76 + Math.floor(i / 2) * 14;
          const pw = POWERS[k];
          g.rect(x + 1, y, 7, 7, pw.color); g.rect(x, y + 1, 9, 5, pw.color); g.draw(pw.icon, x + 3, y + 1);
          g.text(pw.label, x + 13, y - 2, C.white);
        });
        if (Math.floor(t * 2) % 2) g.text("點擊或按空白鍵開始", W / 2, 124, C.yellow, { align: "center" });
      }
      if (state === "clear") {
        g.rect(24, 52, W - 48, 50, C.white); g.rect(26, 54, W - 52, 46, C.navy);
        g.text(`LEVEL ${level} CLEAR!`, W / 2, 62, C.yellow, { align: "center", shadow: C.ink });
        g.text(`BONUS +${100 * level}`, W / 2, 80, C.white, { align: "center" });
      }
      if (state === "over") {
        g.rect(16, 36, W - 32, 90, C.white); g.rect(18, 38, W - 36, 86, C.navy);
        g.text("GAME OVER", W / 2, 44, C.red, { align: "center", size: 24, shadow: C.ink });
        g.text(`SCORE ${score}　LV ${level}`, W / 2, 74, C.white, { align: "center" });
        g.text(newRecord ? "NEW RECORD!" : `BEST ${best}`, W / 2, 90, newRecord ? C.yellow : C.light, { align: "center" });
        if (stateT > 0.8 && Math.floor(t * 2) % 2) g.text("點擊或按空白鍵再玩一次", W / 2, 108, C.white, { align: "center" });
      }
    },
  };

  PX.run(document.getElementById("game"), game);
})();
