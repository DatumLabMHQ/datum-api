import { q } from './db';
import { type Resource } from './registry';

export type QueryInput = { filters: Record<string, string>; since?: string; until?: string; limit?: number };
export type QueryResult = { resource: string; table: string; day?: string | null; count: number; as_of: string | null; rows: Record<string, unknown>[] };

const MAX_LIMIT = 5000;
const ident = (c: string) => `"${c.replace(/"/g, '')}"`;

function coerce(v: string, t: 'text' | 'int' | 'bool' | 'date'): unknown {
  if (t === 'int') { const n = Number(v); if (!Number.isInteger(n)) throw new Error(`expected integer, got ${v}`); return n; }
  if (t === 'bool') { if (!/^(true|false|1|0)$/i.test(v)) throw new Error(`expected boolean, got ${v}`); return /^(true|1)$/i.test(v); }
  if (t === 'date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`expected YYYY-MM-DD, got ${v}`); return v; }
  return v;
}

/** Build and run a parameterised read against one registry resource. */
export async function runResource(r: Resource, input: QueryInput): Promise<QueryResult> {
  const where: string[] = []; const params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  for (const [k, v] of Object.entries(input.filters)) {
    const t = r.filters[k];
    if (!t) throw new Error(`unknown filter "${k}" for ${r.product}/${r.name}; allowed: ${Object.keys(r.filters).join(', ')}`);
    where.push(`${ident(k)} = ${p(coerce(v, t))}`);
  }
  const tcol = r.timeColumn ?? r.dayColumn;
  if (input.since && tcol) where.push(`${ident(tcol)} >= ${p(coerce(input.since, 'date'))}`);
  if (input.until && tcol) where.push(`${ident(tcol)} <= ${p(coerce(input.until, 'date'))}`);
  // Daily tables default to the latest day so a bare call answers "now".
  let day: string | null = input.filters.day ?? null;
  if (r.dayColumn && !input.filters.day && !input.since && !input.until) {
    const [m] = await q<{ d: string | null }>(`select max(${ident(r.dayColumn)})::text as d from ${r.table}`);
    day = m?.d ?? null;
    if (day) where.push(`${ident(r.dayColumn)} = ${p(day)}`);
  }
  const limit = Math.max(1, Math.min(MAX_LIMIT, input.limit ?? 500));
  const base = r.table === 'ref.raw_defillama_tvl'
    ? `(select distinct on (slug, chain, day) slug, chain, day, tvl_usd, borrowed_usd, fetched_at from ref.raw_defillama_tvl order by slug, chain, day, fetched_at desc) t`
    : r.table;
  const sql = `select * from ${base}${where.length ? ' where ' + where.join(' and ') : ''} order by ${r.order} limit ${limit}`;
  const rows = await q(sql, params);
  const asOf = rows.reduce<string | null>((acc, row) => {
    const v = (row.as_of ?? row.fetched_at ?? row.ts ?? row.day) as string | Date | undefined;
    const s = v == null ? null : (v instanceof Date ? v.toISOString() : String(v));
    return s && (!acc || s > acc) ? s : acc;
  }, null);
  return { resource: `${r.product}/${r.name}`, table: r.table, day, count: rows.length, as_of: asOf, rows };
}
