// Theme toggle, code copy buttons, scrollable tables, TOC highlighting, hero diffraction.
(function () {
  const root = document.documentElement;

  // ----- theme toggle -----
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "light" ? "#eef1f7" : "#0a1022");
    });
  });

  // ----- code blocks: copy button -----
  const copyIcon = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  const checkIcon = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  document.querySelectorAll(".prose .highlight").forEach((block) => {
    const code = block.querySelector("pre code");
    if (!code) return;
    const lang = code.getAttribute("data-lang");
    if (lang) block.setAttribute("data-lang", lang);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = copyIcon;
    btn.addEventListener("click", async () => {
      // With line numbers on, only copy the code column.
      const cells = code.querySelectorAll(".lntd:last-child");
      const text = cells.length ? Array.from(cells).map((c) => c.innerText).join("") : code.innerText;
      try {
        await navigator.clipboard.writeText(text.replace(/\n$/, ""));
        btn.innerHTML = checkIcon;
        btn.classList.add("is-done");
        btn.setAttribute("aria-label", "Copied");
        setTimeout(() => { btn.innerHTML = copyIcon; btn.classList.remove("is-done"); btn.setAttribute("aria-label", "Copy code"); }, 1600);
      } catch (e) { /* clipboard blocked: leave the button as is */ }
    });
    block.appendChild(btn);
  });

  // ----- wide tables scroll sideways on small screens -----
  document.querySelectorAll(".prose table").forEach((table) => {
    if (table.parentElement.classList.contains("table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  // ----- table of contents -----
  // Wide screens: the list sits in a sticky sidebar (always open).
  // Narrow screens: it's a collapsible box above the article, closed by default.
  const toc = document.querySelector(".post-toc .toc");
  if (toc) {
    const wide = window.matchMedia("(min-width: 80rem)");
    const syncOpen = () => { toc.open = wide.matches; };
    syncOpen();
    wide.addEventListener?.("change", syncOpen);

    const links = Array.from(toc.querySelectorAll("a[href^='#']")).filter((a) => !a.classList.contains("toc-top"));
    const targets = links
      .map((a) => ({ a, el: document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))) }))
      .filter((t) => t.el);
    let current = null, ticking = false;
    const update = () => {
      ticking = false;
      const line = Math.min(240, window.innerHeight * 0.3); // a heading counts as current once it passes this line
      let active = null;
      for (const t of targets) {
        if (t.el.getBoundingClientRect().top - line <= 0) active = t; else break;
      }
      // At the very bottom of the page, highlight the last section.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && targets.length) active = targets[targets.length - 1];
      if (active === current) return;
      current?.a.classList.remove("is-active");
      current = active;
      if (!current) return;
      current.a.classList.add("is-active");
      // Keep the highlighted entry visible inside a long, scrollable list.
      if (wide.matches && toc.scrollHeight > toc.clientHeight) {
        const top = current.a.offsetTop - toc.offsetTop;
        if (top < toc.scrollTop + 24 || top > toc.scrollTop + toc.clientHeight - 48) {
          toc.scrollTo({ top: Math.max(0, top - toc.clientHeight / 3), behavior: "smooth" });
        }
      }
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ----- citations: preview the reference on hover or focus -----
  const cites = document.querySelectorAll(".cite-ref");
  if (cites.length) {
    const pop = document.createElement("div");
    pop.className = "cite-pop";
    pop.setAttribute("role", "tooltip");
    pop.id = "cite-pop";
    pop.hidden = true;
    document.body.appendChild(pop);
    let hideTimer;
    const show = (link) => {
      const item = document.getElementById(decodeURIComponent(link.getAttribute("href").slice(1)));
      if (!item) return;
      clearTimeout(hideTimer);
      pop.innerHTML = item.innerHTML;
      pop.hidden = false;
      link.setAttribute("aria-describedby", "cite-pop");
      const r = link.getBoundingClientRect();
      const w = pop.offsetWidth, h = pop.offsetHeight;
      let left = r.left + window.scrollX + r.width / 2 - w / 2;
      left = Math.max(window.scrollX + 16, Math.min(left, window.scrollX + document.documentElement.clientWidth - w - 16));
      let top = r.bottom + window.scrollY + 8;
      if (r.bottom + h + 16 > window.innerHeight) top = r.top + window.scrollY - h - 8;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    };
    const hide = () => { hideTimer = setTimeout(() => { pop.hidden = true; }, 120); };
    cites.forEach((link) => {
      link.addEventListener("mouseenter", () => show(link));
      link.addEventListener("focus", () => show(link));
      link.addEventListener("mouseleave", hide);
      link.addEventListener("blur", hide);
    });
    pop.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    pop.addEventListener("mouseleave", hide);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") pop.hidden = true; });
  }

  // ----- interactive posts: fit the frame to its page and pass the colour theme on -----
  document.querySelectorAll("iframe.interactive-frame").forEach((frame) => {
    const fixed = frame.hasAttribute("data-fixed-height");
    let stop = () => {};
    const setup = () => {
      stop();
      let doc;
      try { doc = frame.contentDocument; } catch (e) { return; } // page on another site: leave it alone
      if (!doc || !doc.documentElement) return;
      const html = doc.documentElement;

      // Pages that style :root[data-theme="dark"|"light"] follow the site's theme toggle.
      const syncTheme = () => html.setAttribute("data-theme", root.getAttribute("data-theme") || "dark");
      syncTheme();
      const themeWatch = new MutationObserver(syncTheme);
      themeWatch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

      // Links that leave the page open in the whole window, not inside the frame.
      doc.addEventListener("click", (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (!a || a.target) return;
        const samePage = a.origin === doc.location.origin && a.pathname === doc.location.pathname && a.search === doc.location.search;
        if (!samePage) a.target = "_top";
      });

      let sizeWatch = null;
      if (!fixed) {
        const fit = () => {
          const h = Math.ceil(Math.max(html.offsetHeight, doc.body ? doc.body.scrollHeight : 0));
          if (h > 0 && Math.abs(h - frame.clientHeight) > 1) frame.style.height = h + 2 + "px"; // +2: frame border
        };
        fit();
        sizeWatch = new ResizeObserver(fit);
        sizeWatch.observe(html);
        if (doc.body) sizeWatch.observe(doc.body);
      }
      stop = () => { themeWatch.disconnect(); sizeWatch?.disconnect(); };
    };
    frame.addEventListener("load", setup);
    // The frame may have finished loading before this script ran.
    try { if (frame.contentDocument?.readyState === "complete" && frame.contentDocument.URL !== "about:blank") setup(); } catch (e) {}
  });

  // ----- hero title: colour fringes follow the pointer a little -----
  const title = document.querySelector(".hero-title");
  const fine = window.matchMedia("(pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (title && fine && !calm) {
    let frame = 0;
    window.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = title.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        title.style.setProperty("--dx", (dx * 7).toFixed(2) + "px");
        title.style.setProperty("--dy", (dy * 4).toFixed(2) + "px");
      });
    }, { passive: true });
  }
})();
