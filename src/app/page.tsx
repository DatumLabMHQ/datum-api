import { RESOURCES } from '@/lib/registry';
import { QUESTIONS } from '@/lib/questions';

export default function Home() {
  return (
    <main>
      <h1>Datum Platform API</h1>
      <p>Read-only door over the Datum data platform's curated tables. JSON under <code>/api/v1</code>, MCP (streamable HTTP) at <code>/api/mcp</code>. Send the key as <code>x-api-key</code>.</p>
      <h2>Questions</h2>
      <ul>{QUESTIONS.map((x) => <li key={x.id}><code>GET /api/v1/ask/{x.id}?date=YYYY-MM-DD</code> — {x.question}</li>)}</ul>
      <h2>Resources</h2>
      <ul>{RESOURCES.map((r) => <li key={r.product + r.name}><code>GET /api/v1/{r.product}/{r.name}</code> — {r.description} Filters: {Object.keys(r.filters).join(', ')}.</li>)}</ul>
      <h2>Operations</h2>
      <ul><li><code>GET /api/v1/health</code></li><li><code>GET /api/v1/products</code></li><li><code>GET /api/v1/questions</code></li></ul>
    </main>
  );
}
