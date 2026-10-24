# Portfolio

The front door to my projects: one static page, no build step, deployed on Vercel.

| Project | What it is | Live |
|---|---|---|
| [Grainflow](https://github.com/Myselfgitcone/grainflow) | Streaming lakehouse for grain markets: Kafka, Spark, Iceberg, dbt, Dagster | [dashboard](https://grainflow-mauve.vercel.app) |
| [Silo](https://github.com/Myselfgitcone/silo) | MCP server and AI analyst over Grainflow, with guardrails and evals | [ask it](https://silo-production-9efb.up.railway.app) |
| Orderline | CDC into Databricks with a monitored demand forecast | in progress |

`app.js` reads Grainflow's public lake manifest to show how fresh the live data
is. Contact links go in the `CONTACT` list at the top of `app.js`.

Run it locally with any static server, e.g. `python -m http.server`.
