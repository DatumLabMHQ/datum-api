import { keyOk, unauthorized } from '@/lib/auth';
import { q } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!keyOk(req)) return unauthorized();
  const [jobs, sources, build] = await Promise.all([
    q(`select job, product, status, finished_at, rows_written, left(error, 160) as error from (select distinct on (job) * from ops.sync_runs order by job, run_id desc) t order by product, job`),
    q(`select product, source_id, last_status, expected_hours, round((extract(epoch from now() - last_seen_at)/3600)::numeric, 1) as age_hours from ops.source_freshness order by product, source_id`),
    q<{ last: string | null }>(`select max(finished_at)::text as last from ops.sync_runs where job = 'dbt.build' and status = 'ok'`),
  ]);
  const problems = [
    ...jobs.filter((j) => j.status === 'error').map((j) => `job ${j.job} errored: ${j.error}`),
    ...sources.filter((s) => s.last_status === 'broken' || Number(s.age_hours) > Number(s.expected_hours)).map((s) => `source ${s.product}/${s.source_id} ${s.last_status}, ${s.age_hours}h old`),
  ];
  return Response.json({ ok: problems.length === 0, last_build: build[0]?.last ?? null, problems, jobs, sources, checked_at: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } });
}
