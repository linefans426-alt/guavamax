/* PX：GUAVAMAX 遊戲廳共用的迷你像素遊戲引擎 */
(() => {
  const PX = {};
  const FONT = '"Cubic", monospace';

  // ── 色票（PICO-8） ──
  PX.C = {
    black: "#000000", navy: "#1d2b53", plum: "#7e2553", green: "#008751",
    brown: "#ab5236", gray: "#5f574f", light: "#c2c3c7", white: "#fff1e8",
    red: "#ff004d", orange: "#ffa300", yellow: "#ffec27", lime: "#00e436",
    blue: "#29adff", lavender: "#83769c", pink: "#ff77a8", peach: "#ffccaa",
    ink: "#241a3a", night: "#10131f",
  };

  // ── 像素圖：用字串陣列畫圖，轉成離屏 canvas ──
  PX.sprite = (rows, palette) => {
    const c = document.createElement("canvas");
    c.width = rows[0].length;
    c.height = rows.length;
    const x = c.getContext("2d");
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        if (palette[ch]) { x.fillStyle = palette[ch]; x.fillRect(i, j, 1, 1); }
      });
    });
    return c;
  };

  // ── 本機最高分（瀏覽器不支援儲存時就只在這次遊玩中記住） ──
  const memo = {};
  PX.best = (key, value) => {
    const k = "px-best-" + key;
    if (value !== undefined) {
      memo[k] = value;
      try { localStorage.setItem(k, String(value)); } catch (e) {}
      return value;
    }
    try { const v = localStorage.getItem(k); if (v !== null) return Number(v); } catch (e) {}
    return memo[k] || 0;
  };

  // ── 音效：簡單的 8-bit 嗶聲 ──
  let audio = null;
  let muted = false;
  try { muted = localStorage.getItem("px-muted") === "1"; } catch (e) {}
  PX.isMuted = () => muted;
  PX.setMuted = (m) => { muted = m; try { localStorage.setItem("px-muted", m ? "1" : "0"); } catch (e) {} };
  PX.beep = (freq = 440, dur = 0.08, type = "square", vol = 0.06, slide = 0) => {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audio.currentTime);
      if (slide) o.frequency.linearRampToValueAtTime(freq + slide, audio.currentTime + dur);
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + dur);
    } catch (e) {}
  };

  // ── 主程式 ──
  PX.run = (canvas, game) => {
    const W = game.width, H = game.height;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // 輸入狀態
    const input = {
      held: new Set(),
      hit: new Set(),
      pointer: { x: W / 2, y: H / 2, down: false, tapped: false, active: false },
    };
    const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"];
    const onKeyDown = (e) => {
      if (!canvas.isConnected) return;
      if (GAME_KEYS.includes(e.key) && canvas.dataset.focus === "1") e.preventDefault();
      if (!input.held.has(e.key)) input.hit.add(e.key.toLowerCase());
      input.held.add(e.key);
    };
    const onKeyUp = (e) => input.held.delete(e.key);
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);

    const toGame = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    canvas.addEventListener("pointerdown", (e) => {
      canvas.dataset.focus = "1";
      const p = toGame(e);
      Object.assign(input.pointer, p, { down: true, tapped: true, active: true });
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = toGame(e);
      Object.assign(input.pointer, p, { active: true });
    });
    const up = () => { input.pointer.down = false; };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    document.addEventListener("pointerdown", (e) => { if (e.target !== canvas) canvas.dataset.focus = "0"; });
    canvas.dataset.focus = "1";

    // 繪圖工具
    const g = {
      ctx, W, H,
      clear(c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); },
      rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); },
      draw(spr, x, y, flip = false, s = 1) {
        x = Math.round(x); y = Math.round(y);
        const w = spr.width * s, h = spr.height * s;
        if (!flip) { ctx.drawImage(spr, x, y, w, h); return; }
        ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0, w, h); ctx.restore();
      },
      text(str, x, y, c = PX.C.white, opts = {}) {
        const size = opts.size || 12;
        ctx.font = `${size}px ${FONT}`;
        ctx.textBaseline = "top";
        ctx.textAlign = opts.align || "left";
        if (opts.shadow) { ctx.fillStyle = opts.shadow; ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1); }
        ctx.fillStyle = c;
        ctx.fillText(str, Math.round(x), Math.round(y));
      },
    };

    const api = {
      W, H, input,
      key: (...names) => names.some((n) => input.held.has(n)),
      hit: (...names) => names.some((n) => input.hit.has(n.toLowerCase())),
      tapped: () => input.pointer.tapped,
    };

    let paused = false;
    document.addEventListener("visibilitychange", () => { paused = document.hidden; last = performance.now(); });

    const STEP = 1 / 60;
    let last = performance.now();
    let acc = 0;
    game.init && game.init(api);

    const frame = (now) => {
      if (!paused) {
        acc += Math.min(0.25, (now - last) / 1000);
        while (acc >= STEP) {
          game.update(STEP, api);
          input.hit.clear();
          input.pointer.tapped = false;
          acc -= STEP;
        }
        game.draw(g, api);
      }
      last = now;
      requestAnimationFrame(frame);
    };

    const start = () => requestAnimationFrame((t) => { last = t; frame(t); });
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`12px ${FONT}`).then(start, start);
    } else {
      start();
    }
    return api;
  };

  // 靜音按鈕（頁面上 data-px-mute 的按鈕）
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-px-mute]").forEach((btn) => {
      const sync = () => { btn.textContent = PX.isMuted() ? "SOUND OFF" : "SOUND ON"; btn.setAttribute("aria-pressed", String(!PX.isMuted())); };
      sync();
      btn.addEventListener("click", () => { PX.setMuted(!PX.isMuted()); sync(); if (!PX.isMuted()) PX.beep(660, 0.08); });
    });
  });

  window.PX = PX;
})();
