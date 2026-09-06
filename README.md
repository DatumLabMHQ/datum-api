# datum-api

Read-only HTTP API and MCP server over the Datum data platform (`DatumLabMHQ/datum-models`). One registry of
curated tables, one list of consensus questions, served two ways so dashboards, reports and agents get the same number.

- `GET /api/v1/products` — resources and their filters
- `GET /api/v1/{product}/{resource}?day=&…&limit=` — rows from a curated table (latest day by default)
- `GET /api/v1/questions` and `GET /api/v1/ask/{id}?date=` — the datum-context eval questions, answered from the canonical SQL
- `GET /api/v1/health` — latest run per job, source freshness, last build
- `POST /api/mcp` — MCP streamable HTTP with tools `list_products`, `list_questions`, `ask`, `query`, `health`

Auth: when `DATUM_API_KEYS` is set, send `x-api-key: <key>` (or `Authorization: Bearer`, or `?key=`). Reads use the
`datum_reader` role only. Deployed on the Datum Labs Vercel account.

Claude Code: `claude mcp add --transport http datum https://<host>/api/mcp --header "x-api-key: <key>"`
