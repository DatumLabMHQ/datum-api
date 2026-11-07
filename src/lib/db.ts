import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Read-only connection (role datum_reader) over Neon's HTTP driver. Each query is one stateless
// fetch, so the client is safe to reuse across requests on Cloudflare Workers (a WebSocket Pool
// held at module scope is not: Workers forbid I/O objects shared between requests).
let sql: NeonQueryFunction<false, false> | null = null;
function db(): NeonQueryFunction<false, false> {
  if (sql) return sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  sql = neon(url);
  return sql;
}

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await db().query(text, params)) as T[];
}
