// Client-side search over /index.json (no external libraries).
(function () {
  const input = document.getElementById("search-input");
  const out = document.getElementById("search-results");
  const status = document.getElementById("search-status");
  if (!input || !out) return;

  let index = null;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase();

  function highlight(text, terms) {
    let html = esc(text);
    terms.forEach((t) => {
      if (t.length < 2) return;
      html = html.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
    });
    return html;
  }

  function snippet(item, terms) {
    const text = item.content || item.summary || "";
    const lower = text.toLowerCase();
    let at = -1;
    for (const t of terms) { at = lower.indexOf(t); if (at >= 0) break; }
    if (at < 0) return item.summary || "";
    const start = Math.max(0, at - 70);
    return (start > 0 ? "…" : "") + text.slice(start, start + 200).trim() + "…";
  }

  function score(item, terms) {
    let s = 0;
    const title = norm(item.title), tags = norm((item.tags || []).join(" ")), summary = norm(item.summary), content = norm(item.content);
    for (const t of terms) {
      let hit = false;
      if (title.includes(t)) { s += 10; hit = true; }
      if (tags.includes(t)) { s += 6; hit = true; }
      if (summary.includes(t)) { s += 3; hit = true; }
      if (content.includes(t)) { s += 1; hit = true; }
      if (!hit) return 0; // every term must match somewhere
    }
    return s;
  }

  function run() {
    const q = input.value.trim();
    const params = new URLSearchParams(location.search);
    if (q) params.set("q", q); else params.delete("q");
    history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : ""));
    if (!q) { out.innerHTML = ""; status.textContent = ""; return; }
    if (!index) { status.textContent = "Loading…"; return; }
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const results = index.map((item) => ({ item, s: score(item, terms) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
    status.textContent = results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : `Nothing matches “${q}”. Try a shorter or different word.`;
    out.innerHTML = results.slice(0, 30).map(({ item }) => `
      <article class="post-row">
        <span class="post-row-date">${esc(item.section)}<span class="post-row-year">${esc(item.date || "")}</span></span>
        <div class="post-row-body">
          <h3 class="post-row-title"><a href="${esc(item.url)}">${highlight(item.title, terms)}</a></h3>
          <p class="post-row-summary">${highlight(snippet(item, terms), terms)}</p>
        </div>
      </article>`).join("");
  }

  fetch(input.dataset.index)
    .then((r) => r.json())
    .then((data) => { index = data; run(); })
    .catch(() => { status.textContent = "Search couldn't load its index. Reload the page to try again."; });

  const initial = new URLSearchParams(location.search).get("q");
  if (initial) input.value = initial;
  let timer;
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 120); });
})();
