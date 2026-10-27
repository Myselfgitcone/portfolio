# Portfolio

The front door to my projects: one static page, no build step, deployed on Vercel.

| Project | What it is | Live |
|---|---|---|
| [Grainflow](https://github.com/Myselfgitcone/grainflow) | Streaming lakehouse for grain markets: Kafka, Spark, Iceberg, dbt, Dagster | [dashboard](https://grainflow-mauve.vercel.app) |
| [Silo](https://github.com/Myselfgitcone/silo) | MCP server and AI analyst over Grainflow, with guardrails and evals | [ask it](https://silo-production-9efb.up.railway.app) |
| [Orderline](https://github.com/Myselfgitcone/orderline) | CDC from Postgres into Databricks with Debezium, and a late-delivery model checked against planted causes | [the page](https://myselfgitcone.github.io/orderline/) |
| [Footnote](https://github.com/Myselfgitcone/footnote) | Cited answers from SEC 10-K filings: EDGAR to S3 on Lambda, Pinecone, LangGraph and Claude, figures from XBRL, LangSmith evals in CI | [ask it](https://myselfgitcone.github.io/footnote/) |

`app.js` reads Grainflow's public lake manifest, Orderline's page data and
Footnote's status file to show how fresh the live numbers are. Contact links go in the `CONTACT` list at the top of `app.js`.

Run it locally with any static server, e.g. `python -m http.server`.
