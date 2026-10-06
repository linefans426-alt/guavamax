(() => {
  const root = document.documentElement;

  // 深淺色切換
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = root.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // 程式碼複製按鈕
  document.querySelectorAll(".code-block").forEach((block) => {
    const btn = block.querySelector(".copy-btn");
    const pre = block.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
        btn.textContent = "COPIED!";
        btn.classList.add("is-done");
      } catch (e) {
        btn.textContent = "FAIL";
      }
      setTimeout(() => { btn.textContent = "COPY"; btn.classList.remove("is-done"); }, 1600);
    });
  });

  // 閱讀進度 EXP 條
  const fill = document.querySelector(".xp-fill");
  const post = document.querySelector(".post");
  if (fill && post) {
    let ticking = false;
    const update = () => {
      const rect = post.getBoundingClientRect();
      const total = post.offsetHeight - innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      // 以 16px 為一格，讓進度條一格一格長
      const width = Math.floor((ratio * innerWidth) / 16) * 16;
      fill.style.width = width + "px";
      ticking = false;
    };
    addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    addEventListener("resize", update);
    update();
  }
})();

/* ── 私訊表單 ── */
(() => {
  const ERRORS = {
    invalid_name: "請填寫暱稱（50 字以內）。",
    invalid_email: "Email 格式不太對，請再確認一次。",
    invalid_message: "留言內容需要 5～2000 字。",
    too_many_requests: "送出太頻繁了，請過幾分鐘再試。",
    origin_not_allowed: "目前無法從這個頁面送出。",
    captcha_failed: "人機驗證沒有通過，請重新驗證後再送出。",
  };
  const params = new URLSearchParams(location.search);

  document.querySelectorAll(".contact-form").forEach((form) => {
    const startedAt = Date.now();
    const status = form.querySelector(".contact-status");
    const button = form.querySelector('button[type="submit"]');
    const textarea = form.querySelector("textarea");
    const counter = form.querySelector(".contact-count");

    const setStatus = (text, type) => {
      status.textContent = text;
      status.className = "contact-status" + (type ? " is-" + type : "");
    };

    textarea.addEventListener("input", () => {
      counter.textContent = `${textarea.value.length} / 2000`;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const field = (n) => form.elements.namedItem(n);
      if (!data.name.trim()) { setStatus(ERRORS.invalid_name, "error"); field("name").focus(); return; }
      if (data.message.trim().length < 5) { setStatus(ERRORS.invalid_message, "error"); textarea.focus(); return; }
      if (data.email && !field("email").checkValidity()) { setStatus(ERRORS.invalid_email, "error"); field("email").focus(); return; }

      // 從文章頁點進來時，記錄是哪一篇
      let page = location.href.split("#")[0];
      const from = params.get("from");
      if (from && from.startsWith(location.origin + "/")) page = from;

      button.disabled = true;
      setStatus("傳送中…", "");
      try {
        const res = await fetch(form.dataset.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, page, elapsed: Date.now() - startedAt }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          form.innerHTML = '<div class="contact-done"><p class="contact-done-title">MESSAGE SENT!</p>' +
            "<p>謝謝你的留言，我收到了！有留 Email 的話，我會盡快回覆。</p></div>";
          return;
        }
        setStatus(ERRORS[json.error] || "送出失敗，請稍後再試，或直接寄信給我。", "error");
        if (window.turnstile) window.turnstile.reset();
      } catch (err) {
        setStatus("目前無法連線，請稍後再試，或直接寄信到 linefans426@gmail.com。", "error");
      }
      button.disabled = false;
    });
  });

  // 文章裡的「私訊」連結帶上目前頁面，留言時就知道是從哪篇來的
  document.querySelectorAll("a.contact-link").forEach((a) => {
    if (location.pathname.startsWith("/posts/")) {
      a.href = "/contact/?from=" + encodeURIComponent(location.href.split("#")[0]);
    }
  });
})();

/* ── 公開留言（giscus）：延遲載入並同步深淺色 ── */
(() => {
  const mount = document.querySelector(".giscus-mount");
  if (!mount) return;
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const theme = () => (isDark() ? "dark_dimmed" : "light");
  const load = () => {
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    const d = mount.dataset;
    Object.entries({
      repo: d.repo, "repo-id": d.repoId, category: d.category, "category-id": d.categoryId,
      mapping: "pathname", strict: "0", "reactions-enabled": "1", "emit-metadata": "0",
      "input-position": "top", theme: theme(), lang: "zh-TW", loading: "lazy",
    }).forEach(([k, v]) => s.setAttribute("data-" + k, v));
    mount.appendChild(s);
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: "400px" });
    io.observe(mount);
  } else {
    load();
  }
  const sync = () => {
    const frame = document.querySelector("iframe.giscus-frame");
    if (frame) frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme() } } }, "https://giscus.app");
  };
  document.querySelector(".theme-toggle")?.addEventListener("click", () => setTimeout(sync, 0));
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", sync);
})();
