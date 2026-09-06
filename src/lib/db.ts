import { Pool } from '@neondatabase/serverless';

// Read-only connection (role datum_reader). One pool per function instance.
let pool: Pool | null = null;
export function db(): Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  pool = new Pool({ connectionString: url });
  return pool;
}

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await db().query(text, params);
  return res.rows as T[];
}
