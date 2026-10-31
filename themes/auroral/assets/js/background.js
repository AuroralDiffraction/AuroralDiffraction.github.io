// Aurora over silicon: animated, responsive site background.
//
//  - Sky: aurora curtains drawn as vertical rays, coloured by real emission lines
//    (O 557.7 nm green at the lower edge, fading up through N2+ violet to O 630 nm red),
//    with a slowly drifting interference (diffraction) pattern across the rays.
//  - Ground: a Manhattan-routed interconnect layer like a die plot, with signal
//    pulses travelling along the wires.
//
// Respects prefers-reduced-motion (renders one still frame), pauses when the tab is
// hidden, caps device pixel ratio and frame rate, and scales detail to screen size.

(function () {
  const canvas = document.getElementById("sky");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  // Static layer (sky gradient + wiring) is painted only on resize / theme change;
  // the animated canvas on top only carries the aurora, stars and pulses.
  const staticCanvas = document.createElement("canvas");
  staticCanvas.className = "sky sky-static";
  staticCanvas.setAttribute("aria-hidden", "true");
  canvas.parentNode.insertBefore(staticCanvas, canvas);
  const sctx = staticCanvas.getContext("2d");
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const FPS = 30;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);   // static layer: crisp wires
  let ADPR = 1;                                             // animated layer: soft by nature, so on very
                                                            // large screens it renders below 1x to stay smooth
  // The aurora is rendered small and upscaled: cheap and naturally soft. Capped so very
  // wide screens don't draw more rays than a laptop does.
  const auroraScale = () => Math.min(0.34, 520 / Math.max(1, W));

  let W = 0, H = 0;           // CSS pixels
  let colors = {};
  let isLight = false;
  let auroraCanvas, actx, blurCanvas, bctx, glowSprite, raySprites = {};
  let circuitCanvas, routes = [], pulses = [], stars = [];
  let raf = 0, last = 0, t0 = performance.now(), running = false;

  // ---------- helpers ----------
  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function hexToRgb(hex) {
    const m = hex.replace("#", "");
    const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(rgb, a) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }
  // Small deterministic PRNG so the circuit is stable across redraws of the same size.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function readTheme() {
    isLight = root.getAttribute("data-theme") === "light";
    colors = {
      green: hexToRgb(cssVar("--green") || "#52f2a6"),
      violet: hexToRgb(cssVar("--violet") || "#8c7bff"),
      red: hexToRgb(cssVar("--red") || "#ff6b6b"),
      copper: hexToRgb(cssVar("--copper") || "#d79a5e"),
      bg: hexToRgb(cssVar("--bg") || "#0a1022"),
      bgDeep: hexToRgb(cssVar("--bg-deep") || "#050913"),
    };
  }

  // A 1px-wide vertical gradient strip, stretched to each ray's height when drawn.
  function makeRaySprite(bottom, mid, top) {
    const c = document.createElement("canvas");
    c.width = 1; c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0.0, rgba(bottom, 0));
    grad.addColorStop(0.04, rgba(bottom, 1));
    grad.addColorStop(0.18, rgba(bottom, 0.75));
    grad.addColorStop(0.5, rgba(mid, 0.32));
    grad.addColorStop(0.82, rgba(top, 0.12));
    grad.addColorStop(1.0, rgba(top, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 1, 128);
    return c;
  }

  // ---------- setup ----------
  function resize() {
    W = window.innerWidth;
    H = Math.max(window.innerHeight, document.documentElement.clientHeight);
    ADPR = Math.max(0.6, Math.min(1, 1800 / W));
    canvas.width = Math.round(W * ADPR);
    canvas.height = Math.round(H * ADPR);
    staticCanvas.width = Math.round(W * DPR);
    staticCanvas.height = Math.round(H * DPR);

    auroraCanvas = auroraCanvas || document.createElement("canvas");
    auroraCanvas.width = Math.max(1, Math.round(W * auroraScale()));
    auroraCanvas.height = Math.max(1, Math.round(H * auroraScale()));
    actx = auroraCanvas.getContext("2d");
    blurCanvas = blurCanvas || document.createElement("canvas");
    blurCanvas.width = auroraCanvas.width;
    blurCanvas.height = auroraCanvas.height;
    bctx = blurCanvas.getContext("2d");

    buildSprites();
    buildStars();
    buildCircuit();
  }

  function paintStatic() {
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawBackdrop(sctx);
    sctx.drawImage(circuitCanvas, 0, 0, W, H);
  }

  function buildSprites() {
    const { green, violet, red } = colors;
    raySprites.main = makeRaySprite(green, green.map((v, i) => Math.round(v * 0.6 + violet[i] * 0.4)), red);
    raySprites.back = makeRaySprite(violet.map((v, i) => Math.round(v * 0.5 + green[i] * 0.5)), violet, violet);
    glowSprite = document.createElement("canvas");
    glowSprite.width = glowSprite.height = 20;
    const g = glowSprite.getContext("2d");
    const rg = g.createRadialGradient(10, 10, 0, 10, 10, 10);
    rg.addColorStop(0, rgba(green, 0.9));
    rg.addColorStop(0.35, rgba(green, 0.45));
    rg.addColorStop(1, rgba(green, 0));
    g.fillStyle = rg;
    g.fillRect(0, 0, 20, 20);
  }

  function buildStars() {
    const rand = mulberry32(7);
    const n = Math.round((W * H) / 9000);
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({ x: rand() * W, y: Math.pow(rand(), 1.6) * H * 0.7, r: rand() * 1.1 + 0.25, p: rand() * Math.PI * 2, s: 0.5 + rand() * 1.5 });
    }
  }

  // Routes live in the lower part of the screen ("the die"), fading out towards the sky.
  function buildCircuit() {
    const rand = mulberry32(Math.round(W) * 31 + 17);
    const pitch = W < 640 ? 18 : 22;
    const top = H * 0.56;
    const cols = Math.ceil(W / pitch) + 2;
    const rows = Math.ceil((H - top) / pitch) + 1;
    const occupied = new Set();
    const key = (c, r) => c + "," + r;

    routes = [];
    const target = Math.round((cols * rows) / (W < 640 ? 30 : 26));
    let attempts = 0;
    while (routes.length < target && attempts < target * 6) {
      attempts++;
      let c = Math.floor(rand() * cols) - 1;
      let r = Math.floor(rand() * rows);
      if (occupied.has(key(c, r))) continue;
      const pts = [[c, r]];
      let horizontal = rand() < 0.7; // preferred direction: horizontal metal
      const segs = 2 + Math.floor(rand() * 4);
      let ok = true;
      for (let s = 0; s < segs && ok; s++) {
        const len = (horizontal ? 3 : 1) + Math.floor(rand() * (horizontal ? 12 : 5));
        const dir = rand() < 0.5 ? -1 : 1;
        for (let k = 0; k < len; k++) {
          if (horizontal) c += dir; else r += dir;
          if (r < 0 || r >= rows || occupied.has(key(c, r))) { ok = s > 0; if (horizontal) c -= dir; else r -= dir; break; }
          occupied.add(key(c, r));
        }
        pts.push([c, r]);
        horizontal = !horizontal;
      }
      if (pts.length < 3) continue;
      // to CSS px, with cumulative lengths for pulse travel
      const p = pts.map(([cc, rr]) => [cc * pitch, top + rr * pitch]);
      const lens = [0];
      for (let i = 1; i < p.length; i++) lens.push(lens[i - 1] + Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]));
      if (lens[lens.length - 1] < pitch * 4) continue;
      routes.push({ p, lens, total: lens[lens.length - 1], layer: rand() < 0.5 ? 1 : 2 });
    }

    // Pre-render the static wiring once.
    circuitCanvas = circuitCanvas || document.createElement("canvas");
    circuitCanvas.width = staticCanvas.width;
    circuitCanvas.height = staticCanvas.height;
    const g = circuitCanvas.getContext("2d");
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    g.lineCap = "square";
    g.lineJoin = "miter";

    const { copper, violet } = colors;
    const wireA = isLight ? 0.32 : 0.34;
    for (const rt of routes) {
      g.strokeStyle = rgba(rt.layer === 1 ? copper : violet, rt.layer === 1 ? wireA : wireA * 0.8);
      g.lineWidth = rt.layer === 1 ? 1.6 : 1.1;
      g.beginPath();
      g.moveTo(rt.p[0][0], rt.p[0][1]);
      for (let i = 1; i < rt.p.length; i++) g.lineTo(rt.p[i][0], rt.p[i][1]);
      g.stroke();
      // vias at bends, pads at the ends
      g.fillStyle = rgba(copper, wireA + 0.15);
      for (let i = 1; i < rt.p.length - 1; i++) g.fillRect(rt.p[i][0] - 2, rt.p[i][1] - 2, 4, 4);
      g.strokeStyle = rgba(copper, wireA + 0.1);
      g.lineWidth = 1;
      for (const end of [rt.p[0], rt.p[rt.p.length - 1]]) g.strokeRect(end[0] - 3.5, end[1] - 3.5, 7, 7);
    }

    // Fade the die into the sky.
    g.globalCompositeOperation = "destination-in";
    const fade = g.createLinearGradient(0, H * 0.5, 0, H);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.35, "rgba(0,0,0,0.55)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = fade;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "source-over";

    // Signal pulses on a subset of routes.
    const rand2 = mulberry32(99);
    pulses = [];
    const count = Math.min(routes.length, Math.round(routes.length * 0.28));
    for (let i = 0; i < count; i++) {
      const rt = routes[Math.floor(rand2() * routes.length)];
      pulses.push({ rt, pos: rand2() * rt.total, speed: 40 + rand2() * 90, dir: rand2() < 0.5 ? 1 : -1 });
    }
  }

  function pointOn(rt, d) {
    d = Math.max(0, Math.min(rt.total, d));
    let i = 1;
    while (i < rt.lens.length - 1 && rt.lens[i] < d) i++;
    const a = rt.p[i - 1], b = rt.p[i];
    const segLen = rt.lens[i] - rt.lens[i - 1] || 1;
    const f = (d - rt.lens[i - 1]) / segLen;
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  // ---------- drawing ----------
  function drawBackdrop(ctx) {
    const { bg, bgDeep, violet } = colors;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (isLight) {
      g.addColorStop(0, rgba(bg.map((v, i) => Math.round(v * 0.94 + violet[i] * 0.06)), 1));
      g.addColorStop(1, rgba(bg, 1));
    } else {
      g.addColorStop(0, rgba(bgDeep, 1));
      g.addColorStop(0.55, rgba(bg, 1));
      g.addColorStop(1, rgba(bg.map((v, i) => Math.round(v * 0.85 + violet[i] * 0.08)), 1));
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStars(t) {
    if (isLight) return;
    for (const s of stars) {
      const a = 0.35 + 0.35 * Math.sin(t * s.s + s.p);
      ctx.fillStyle = `rgba(230,236,255,${a.toFixed(3)})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }

  // Each curtain: a wavy lower edge, ray heights from slow noise, and a moving
  // two-slit-style fringe pattern multiplying the brightness.
  function drawAurora(t) {
    const aw = auroraCanvas.width, ah = auroraCanvas.height;
    actx.clearRect(0, 0, aw, ah);
    actx.globalCompositeOperation = isLight ? "source-over" : "lighter";
    const narrow = W < 640;
    const step = narrow ? 1.5 : 1;          // aurora-canvas px between rays
    const curtains = [
      { sprite: raySprites.back, base: 0.30, amp: 0.05, k: 1.7, w: 0.05, hgt: 0.22, alpha: isLight ? 0.22 : 0.35, phase: 2.1 },
      { sprite: raySprites.main, base: narrow ? 0.30 : 0.36, amp: 0.07, k: 2.4, w: 0.07, hgt: narrow ? 0.24 : 0.3, alpha: isLight ? 0.3 : 0.55, phase: 0 },
      { sprite: raySprites.main, base: narrow ? 0.38 : 0.46, amp: 0.05, k: 3.3, w: -0.06, hgt: 0.2, alpha: isLight ? 0.2 : 0.32, phase: 4.2 },
    ];
    for (const c of curtains) {
      for (let x = 0; x < aw; x += step) {
        const u = x / aw;
        // lower edge of the curtain folds back and forth
        const edge = (c.base + c.amp * Math.sin(u * c.k * Math.PI * 2 + t * c.w * 6 + c.phase) + 0.025 * Math.sin(u * 13 + t * 0.4 + c.phase)) * ah;
        // brightness envelope: a few slow travelling waves, clipped to make gaps
        let env = 0.55 * Math.sin(u * 5.1 + t * 0.21 + c.phase) + 0.35 * Math.sin(u * 9.7 - t * 0.33 + c.phase * 2) + 0.25 * Math.sin(u * 2.3 + t * 0.12);
        env = Math.max(0, env + 0.35);
        if (env <= 0.01) continue;
        // interference fringes drifting across the curtain
        const fringe = 0.62 + 0.38 * Math.cos(u * 70 + Math.sin(t * 0.25 + u * 3) * 6 + c.phase);
        // fine ray structure
        const ray = 0.75 + 0.25 * Math.sin(x * 1.7 + t * 2.2 + c.phase) * Math.sin(x * 0.37 - t * 0.9);
        const I = Math.min(1, env * fringe * ray);
        const h = c.hgt * ah * (0.45 + 0.75 * I);
        actx.globalAlpha = c.alpha * I;
        actx.drawImage(c.sprite, x, edge - h, step + 0.6, h);
      }
    }
    actx.globalAlpha = 1;
    actx.globalCompositeOperation = "source-over";

    // Blur at low resolution (cheap), then upscale; a faint unblurred pass keeps the ray texture.
    bctx.clearRect(0, 0, aw, ah);
    bctx.filter = "blur(1.2px)";
    bctx.drawImage(auroraCanvas, 0, 0);
    bctx.filter = "none";
    bctx.globalAlpha = isLight ? 0.35 : 0.5;
    bctx.drawImage(auroraCanvas, 0, 0);
    bctx.globalAlpha = 1;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(blurCanvas, 0, 0, W, H);
    ctx.restore();
  }

  function drawPulses(dt) {
    if (!pulses.length) return;
    const { green } = colors;
    ctx.save();
    ctx.globalCompositeOperation = isLight ? "source-over" : "lighter";
    for (const p of pulses) {
      p.pos += p.dir * p.speed * dt;
      if (p.pos > p.rt.total || p.pos < 0) {
        p.dir *= -1;
        p.pos = Math.max(0, Math.min(p.rt.total, p.pos));
      }
      const [x, y] = pointOn(p.rt, p.pos);
      const fade = Math.max(0, Math.min(1, (y - H * 0.5) / (H * 0.3)));
      if (fade <= 0) continue;
      // short trail
      for (let k = 1; k <= 6; k++) {
        const [tx, ty] = pointOn(p.rt, p.pos - p.dir * k * 5);
        ctx.fillStyle = rgba(green, (0.32 - k * 0.045) * fade);
        ctx.fillRect(tx - 1.2, ty - 1.2, 2.4, 2.4);
      }
      ctx.globalAlpha = fade;
      ctx.drawImage(glowSprite, x - 10, y - 10);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 1) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    render((now - t0) / 1000, dt);
  }

  function render(t, dt) {
    ctx.setTransform(ADPR, 0, 0, ADPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    drawStars(t);
    drawAurora(t);
    drawPulses(dt);
  }

  function start() {
    if (running) return;
    if (reduceMotion.matches) { render(12, 0); return; }
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // ---------- wiring ----------
  readTheme();
  resize();
  paintStatic();
  start();

  let resizeTimer, lastW = W, lastH = H;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Ignore the small height changes caused by mobile browser toolbars.
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
      lastW = window.innerWidth; lastH = window.innerHeight;
      resize();
      paintStatic();
      if (!running) render(12, 0);
    }, 150);
  });

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener?.("change", () => { stop(); start(); });

  new MutationObserver(() => {
    readTheme();
    buildSprites();
    buildCircuit();
    paintStatic();
    if (!running) render(12, 0);
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
})();
