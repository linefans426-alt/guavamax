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
