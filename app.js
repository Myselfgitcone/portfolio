// Contact links, shown in the nav and footer. Add yours here, e.g.
//   { label: "LinkedIn", href: "https://www.linkedin.com/in/your-name" },
//   { label: "Email", href: "mailto:you@example.com" },
const CONTACT = [];

// Grainflow publishes its lake with an open CORS header, so the hub can show
// how fresh the live data is. Silo reads the same build.
const LAKE_MANIFEST = "https://grainflow-mauve.vercel.app/data/lake/manifest.json";

// Orderline's page data on GitHub Pages, which also allows cross-origin reads.
const ORDERLINE_DATA = "https://myselfgitcone.github.io/orderline/data/site.json";

const stamp = (iso) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

function addContacts() {
  for (const container of document.querySelectorAll("#contact-links, footer .links")) {
    for (const { label, href } of CONTACT) {
      container.append(Object.assign(document.createElement("a"), { textContent: label, href }));
    }
  }
}

async function showFreshness() {
  const pulse = document.getElementById("pulse-text");
  try {
    const manifest = await fetch(LAKE_MANIFEST, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
    const rows = manifest.tables.reduce((sum, t) => sum + t.rows, 0);
    const when = stamp(manifest.generated_at);
    pulse.textContent = `Live data last updated ${when}. Grainflow rebuilds it four times a day and Silo answers from it.`;
    document.getElementById("grainflow-fresh").textContent =
      `Last updated ${when} · ${manifest.tables.length} tables · ${rows.toLocaleString()} rows`;
  } catch {
    pulse.textContent = "Grainflow and Silo refresh four times a day from public sources.";
  }
}

async function showOrderline() {
  try {
    const data = await fetch(ORDERLINE_DATA, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
    const s = data.summary;
    document.getElementById("orderline-fresh").textContent =
      `Last updated ${stamp(data.generated_at)} · ${s.orders.toLocaleString()} orders · ` +
      `${s.open_orders.toLocaleString()} open · ${(s.late_share_30d * 100).toFixed(1)}% late in 30 days`;
  } catch {
    // The card reads fine without it.
  }
}

addContacts();
showFreshness();
showOrderline();
