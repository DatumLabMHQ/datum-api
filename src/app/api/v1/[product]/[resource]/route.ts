import { keyOk, unauthorized } from '@/lib/auth';
import { findResource } from '@/lib/registry';
import { runResource } from '@/lib/query';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ product: string; resource: string }> }) {
  if (!keyOk(req)) return unauthorized();
  const { product, resource } = await ctx.params;
  const r = findResource(product, resource);
  if (!r) return Response.json({ error: `unknown resource ${product}/${resource}`, see: '/api/v1/products' }, { status: 404 });
  const sp = new URL(req.url).searchParams;
  const filters: Record<string, string> = {};
  for (const [k, v] of sp.entries()) if (k in r.filters) filters[k] = v;
  try {
    const out = await runResource(r, { filters, since: sp.get('since') ?? undefined, until: sp.get('until') ?? undefined, limit: sp.get('limit') ? Number(sp.get('limit')) : undefined });
    return Response.json(out, { headers: { 'cache-control': 'public, s-maxage=300' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
