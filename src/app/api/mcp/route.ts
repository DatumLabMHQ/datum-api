import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { keyOk, unauthorized } from '@/lib/auth';
import { RESOURCES, findResource, products } from '@/lib/registry';
import { runResource } from '@/lib/query';
import { QUESTIONS, ask } from '@/lib/questions';
import { q } from '@/lib/db';

// MCP server over the platform (streamable HTTP at /api/mcp). Same registry and questions as the
// REST door, so an agent and a dashboard asking the same thing get the same number.
const text = (v: unknown) => ({ content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }] });

async function healthReport() {
  const [jobs, sources, build] = await Promise.all([
    q(`select job, product, status, finished_at, left(error,160) as error from (select distinct on (job) * from ops.sync_runs order by job, run_id desc) t order by product, job`),
    q(`select product, source_id, last_status, expected_hours, round((extract(epoch from now() - last_seen_at)/3600)::numeric,1) as age_hours from ops.source_freshness order by 1,2`),
    q<{ last: string | null }>(`select max(finished_at)::text as last from ops.sync_runs where job = 'dbt.build' and status = 'ok'`),
  ]);
  const problems = [
    ...jobs.filter((j) => j.status === 'error').map((j) => `job ${j.job} errored: ${j.error}`),
    ...sources.filter((s) => s.last_status === 'broken' || Number(s.age_hours) > Number(s.expected_hours)).map((s) => `source ${s.product}/${s.source_id} stale`),
  ];
  return { ok: problems.length === 0, last_build: build[0]?.last ?? null, problems, jobs, sources };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool('list_products', { description: 'List the products in the Datum data platform and the resources (curated tables) each exposes, with their filters.' },
      async () => text({ products: products(), resources: RESOURCES.map((r) => ({ id: `${r.product}/${r.name}`, table: r.table, grain: r.grain, description: r.description, filters: r.filters })) }));

    server.registerTool('list_questions', { description: 'List the canonical consensus questions the platform answers, with ids and the metric definition each uses.' },
      async () => text(QUESTIONS.map((x) => ({ id: x.id, product: x.product, metric: x.metric, question: x.question }))));

    server.registerTool('ask', {
      description: 'Answer one canonical question for a date (YYYY-MM-DD; default: latest day with data). Returns value, unit, the date used and the SQL behind it.',
      inputSchema: z.object({ question_id: z.string().describe('id from list_questions'), date: z.string().optional().describe('YYYY-MM-DD') }),
    }, async (args) => { const a = args as { question_id: string; date?: string }; return text(await ask(a.question_id, a.date)); });

    server.registerTool('query', {
      description: 'Read rows from one resource (product and name from list_products). Filters must come from that resource\'s filter list. Daily tables default to the latest day; pass day, or since/until (YYYY-MM-DD).',
      inputSchema: z.object({ product: z.string(), resource: z.string(), filters: z.record(z.string(), z.string()).optional(), since: z.string().optional(), until: z.string().optional(), limit: z.number().int().min(1).max(5000).optional() }),
    }, async (args) => {
      const a = args as { product: string; resource: string; filters?: Record<string, string>; since?: string; until?: string; limit?: number };
      const r = findResource(a.product, a.resource);
      if (!r) throw new Error(`unknown resource ${a.product}/${a.resource}`);
      return text(await runResource(r, { filters: a.filters ?? {}, since: a.since, until: a.until, limit: a.limit }));
    });

    server.registerTool('health', { description: 'Platform health: latest run per job, source freshness, last successful build, and current problems.' },
      async () => text(await healthReport()));
  },
  { serverInfo: { name: 'datum-platform', version: '0.1.0' } },
);

async function guarded(req: Request) {
  if (!keyOk(req)) return unauthorized();
  return handler(req);
}
export { guarded as GET, guarded as POST, guarded as DELETE };
