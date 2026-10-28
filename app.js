// The status board and the per-project live lines read each project's own
// published data. Every feed is served with an open CORS header. If one can't
// be reached the board says so; nothing on the page depends on it.

const FEEDS = {
  orderline: "https://myselfgitcone.github.io/orderline/data/site.json",
  grainflow: "https://grainflow-mauve.vercel.app/data/lake/manifest.json",
  grainflowSummary: "https://grainflow-mauve.vercel.app/data/summary.json",
  grainflowWeekly: "https://grainflow-mauve.vercel.app/data/weekly.json",
  footnote: "https://myselfgitcone.github.io/footnote/status.json",
  silo: "https://silo-production-9efb.up.railway.app/api/health",
};

const $ = (id) => document.getElementById(id);
const n = (x) => Number(x).toLocaleString("en-US");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

// Writes text into an element and cancels any count-up still running on it.
function set(el, text) {
  if (!el) return;
  el._countup = null;
  el.textContent = text;
}

function show(id, when, line, extra) {
  const li = $("b-" + id);
  li.classList.add("on");
  li.classList.remove("off");
  set(li.querySelector(".when"), when);
  if (line) set(li.querySelector(".line"), line);
  if (extra) set($(id + "-live"), extra);
}

function down(id) {
  const li = $("b-" + id);
  li.classList.add("off");
  set(li.querySelector(".when"), "not reachable right now");
}

// A small line chart drawn into the row's <svg>, with the latest point marked.
function spark(id, values) {
  const svg = $("b-" + id).querySelector(".spark");
  if (!svg || values.length < 2) return;
  const W = 200, H = 28, pad = 2;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / span) * (H - pad * 2),
  ]);
  const line = pts.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  svg.innerHTML =
    `<path d="M${pts[0][0]},${H} L${line.replace(/ /g, " L")} L${lx},${H} Z" fill="currentColor"/>` +
    `<polyline points="${line}" stroke="currentColor"/>` +
    `<circle class="last" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" fill="currentColor"/>`;
  requestAnimationFrame(() => svg.classList.add("in"));
}

async function read(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function orderline() {
  try {
    const d = await read(FEEDS.orderline);
    const s = d.summary;
    const last = d.syncs?.[d.syncs.length - 1];
    const synced = s.last_landed || s.generated_at || d.generated_at;
    show(
      "orderline",
      `synced ${ago(synced)}`,
      `${n(s.orders)} orders · ${n(s.open_orders)} open · ${Math.round(s.late_share_30d * 100)}% late in the last 30 days` +
        (last ? ` · last sync landed ${n(last.events)} changes` : ""),
      `Live · ${n(s.orders)} orders captured · synced ${ago(synced)}`
    );
    // orders per day, last 30 complete days
    const daily = (d.daily || []).slice(-31, -1).map((x) => x.orders);
    spark("orderline", daily);
  } catch {
    down("orderline");
  }
}

async function grainflow() {
  let built = null;
  try {
    const d = await read(FEEDS.grainflow);
    built = d.generated_at;
    const rows = d.tables.reduce((sum, t) => sum + t.rows, 0);
    show(
      "grainflow",
      `rebuilt ${ago(d.generated_at)}`,
      `${d.tables.length} gold tables · ${n(rows)} rows · futures, weather and crop ratings`,
      `Live · ${n(rows)} rows across ${d.tables.length} tables · rebuilt ${ago(d.generated_at)}`
    );
  } catch {
    down("grainflow");
  }
  // The signal numbers in the Grainflow card come from the latest build too.
  try {
    const s = await read(FEEDS.grainflowSummary);
    const sig = s.signal;
    if (sig && $("gf-fell")) {
      const pct = (sig.fell_avg * 100).toFixed(2);
      set($("gf-fell"), `${sig.fell_avg >= 0 ? "+" : ""}${pct}% next week`);
      set($("gf-p"), `p ≈ ${sig.p_value.toFixed(2)} over ${sig.weeks} weeks`);
    }
    if (s.volumes && $("gf-q")) {
      const v = s.volumes;
      const loaded = (v.price_bars || 0) + (v.weather_observations || 0) + (v.crop_condition || 0);
      set($("gf-q"), `${n(v.quarantine || 0)} contract failures`);
      set($("gf-q-sub"), `across ${n(loaded)} rows loaded`);
    }
  } catch {}
  try {
    const w = await read(FEEDS.grainflowWeekly);
    const closes = w.slice(-52).map((x) => x.corn_close).filter((x) => typeof x === "number");
    spark("grainflow", closes);
  } catch {}
  return built;
}

async function footnote() {
  try {
    const d = await read(FEEDS.footnote);
    const latest = d.latest_filing;
    show(
      "footnote",
      `indexed ${ago(d.generated_at)}`,
      `${d.filings} annual reports · ${d.companies} companies · ${n(d.passages)} passages · newest: ${latest.name} FY${latest.fiscal_year}`,
      `Live · ${d.filings} annual reports · ${n(d.passages)} passages · updated ${ago(d.generated_at)}`
    );
    set($("footnote-n"), `${d.filings} reports · ${Math.round(d.passages / 1000)}k passages`);
  } catch {
    down("footnote");
  }
}

// Silo's health endpoint has no CORS header, so the page can only learn that it
// answered (an opaque response), not what it said. The lake it serves is the
// Grainflow build above, so that build time is shown as Silo's freshness.
async function silo(builtPromise) {
  try {
    await fetch(FEEDS.silo, { mode: "no-cors", cache: "no-store" });
    const built = await builtPromise;
    show(
      "silo",
      built ? `serving lake built ${ago(built)}` : "up",
      null,
      built ? `Live · answering from the lake built ${ago(built)}` : null
    );
  } catch {
    down("silo");
  }
}

$("board-clock").textContent = new Date().toLocaleString("en-US", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
});
orderline();
footnote();
silo(grainflow());

// Light / dark. Follows the system until the visitor picks, then remembers.
$("theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.getAttribute("data-theme") === "dark" ||
    (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  const next = dark ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch {}
});

// Mobile menu.
const nav = $("nav"), menu = $("menu");
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
nav.querySelectorAll("ul a").forEach((a) => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
}));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); } });

// The Email button copies the address: the icon turns into a tick and the
// address appears under the buttons so it can also be read or selected.
const copyBtn = $("copy-email");
if (copyBtn) copyBtn.addEventListener("click", async () => {
  const email = copyBtn.dataset.email;
  let ok = false;
  try { await navigator.clipboard.writeText(email); ok = true; } catch {}
  if (!ok) {
    const t = document.createElement("textarea");
    t.value = email; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { ok = document.execCommand("copy"); } catch {}
    t.remove();
  }
  const line = $("copied");
  line.hidden = false;
  line.lastChild.textContent = ok ? " copied" : " (select and copy)";
  copyBtn.classList.add("done");
  setTimeout(() => copyBtn.classList.remove("done"), 2500);
});

// ---------- motion ----------

// Numbers in a result tile count up from zero the first time the tile is seen.
// Every numeric token in the text is animated; the rest of the text is kept.
function countUp(el) {
  const template = el.textContent;
  const tokens = [...template.matchAll(/\d[\d,]*(?:\.\d+)?/g)];
  if (!tokens.length) return;
  const targets = tokens.map((m) => {
    const raw = m[0];
    const value = Number(raw.replace(/,/g, ""));
    const decimals = (raw.split(".")[1] || "").length;
    return { raw, value, decimals, commas: raw.includes(","), big: value >= 1000 };
  });
  const t0 = performance.now(), dur = 900;
  const mine = {};
  el._countup = mine;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const frame = (now) => {
    if (el._countup !== mine) return; // a feed wrote newer text; stop
    const k = ease(Math.min(1, (now - t0) / dur));
    let i = 0;
    el.textContent = template.replace(/\d[\d,]*(?:\.\d+)?/g, () => {
      const t = targets[i++];
      const v = t.value * k;
      let s = t.decimals ? v.toFixed(t.decimals) : String(Math.round(v));
      if (t.commas || t.big) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: t.decimals, maximumFractionDigits: t.decimals });
      return s;
    });
    if (k < 1) requestAnimationFrame(frame);
    else { el.textContent = template; el._countup = null; }
  };
  requestAnimationFrame(frame);
}

// Sections ease in as they come into view; children of a .stagger block follow
// one after another; numbers count up. Off when the visitor prefers less motion.
const reveals = document.querySelectorAll(".reveal, .stagger");
if (calm || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  document.querySelectorAll(".stagger").forEach((block) => {
    [...block.children].forEach((child, i) => { child.style.transitionDelay = `${Math.min(i, 10) * 60}ms`; });
  });
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      e.target.querySelectorAll(".results .n").forEach(countUp);
      seen.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px 48px 0px" });
  reveals.forEach((el) => seen.observe(el));
}

// Reading progress, nav highlight for the section in view, and a tighter nav
// once the page has scrolled.
const progress = document.querySelector(".progress");
const navwrap = document.querySelector(".navwrap");
const navLinks = [...nav.querySelectorAll("ul a")];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    navwrap.classList.toggle("scrolled", y > 40);
    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= innerHeight * 0.35) current = s;
    navLinks.forEach((a) => a.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id));
    ticking = false;
  });
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Pointer effects, only with a real mouse: a light follows the cursor across a
// project card, screenshots tilt toward it, the hero glow leans with it.
if (fine && !calm) {
  document.querySelectorAll(".project").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
  document.querySelectorAll(".shot").forEach((shot) => {
    shot.addEventListener("pointermove", (e) => {
      const r = shot.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      shot.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-3px) scale(1.01)`;
    });
    shot.addEventListener("pointerleave", () => { shot.style.transform = ""; });
  });
  const glow = document.querySelector(".glow");
  const hero = document.querySelector(".hero");
  hero.addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    glow.style.transform = `translate(${(x * 30).toFixed(1)}px, ${(y * 24).toFixed(1)}px)`;
  });
}
