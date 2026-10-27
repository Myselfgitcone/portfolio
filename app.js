// The status board and the per-project live lines read each project's own
// published data. Every feed is served with an open CORS header. If one can't
// be reached the board says so; nothing on the page depends on it.

const FEEDS = {
  orderline: "https://myselfgitcone.github.io/orderline/data/site.json",
  grainflow: "https://grainflow-mauve.vercel.app/data/lake/manifest.json",
  footnote: "https://myselfgitcone.github.io/footnote/status.json",
};

const $ = (id) => document.getElementById(id);
const n = (x) => Number(x).toLocaleString("en-US");

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function show(id, when, line, extra) {
  const li = $("b-" + id);
  li.classList.add("on");
  li.querySelector(".when").textContent = when;
  li.querySelector(".line").textContent = line;
  if (extra && $(id + "-live")) $(id + "-live").textContent = extra;
}

function down(id) {
  $("b-" + id).querySelector(".when").textContent = "not reachable right now";
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
  } catch {
    down("orderline");
  }
}

async function grainflow() {
  try {
    const d = await read(FEEDS.grainflow);
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
  } catch {
    down("footnote");
  }
}

$("board-clock").textContent = new Date().toLocaleString("en-US", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
});
orderline();
grainflow();
footnote();

// Sections ease in as they come into view. Off when the visitor prefers less motion.
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
} else {
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => seen.observe(el));
}
