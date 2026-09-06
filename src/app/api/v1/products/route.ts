import { keyOk, unauthorized } from '@/lib/auth';
import { RESOURCES, products } from '@/lib/registry';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!keyOk(req)) return unauthorized();
  return Response.json({
    products: products(),
    resources: RESOURCES.map((r) => ({ path: `/api/v1/${r.product}/${r.name}`, table: r.table, grain: r.grain, description: r.description, filters: r.filters, defaults: r.dayColumn ? 'latest day unless day/since/until given' : 'most recent rows', params: ['limit (max 5000)', ...(r.timeColumn || r.dayColumn ? ['since', 'until'] : [])] })),
  }, { headers: { 'cache-control': 'public, s-maxage=3600' } });
}
