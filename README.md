# jagadish-butukuri.vercel.app

My portfolio: one page, built by hand, no framework.

The status board at the top and the live line under each project read the projects' own published data when the page opens, so the numbers are whatever the systems say right now:

| Project   | Feed |
|-----------|------|
| Orderline | `myselfgitcone.github.io/orderline/data/site.json` (orders per day drawn as a sparkline) |
| Grainflow | `grainflow-mauve.vercel.app/data/lake/manifest.json`, `summary.json` (signal numbers in the card), `weekly.json` (corn close sparkline) |
| Footnote  | `myselfgitcone.github.io/footnote/status.json` |
| Silo      | `/api/health` on Railway, reachability only (no CORS header), freshness taken from the Grainflow build it serves |

Light and dark follow the system; the toggle in the nav remembers a choice. `og.html` is the source of `og.jpg`, the link-preview image: open it in a browser at 1200×630 and screenshot it.

Vercel deploys `main`. Open `index.html` in a browser to preview locally.
