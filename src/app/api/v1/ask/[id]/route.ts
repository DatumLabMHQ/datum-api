import { keyOk, unauthorized } from '@/lib/auth';
import { ask } from '@/lib/questions';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!keyOk(req)) return unauthorized();
  const { id } = await ctx.params;
  const date = new URL(req.url).searchParams.get('date') ?? undefined;
  try {
    return Response.json(await ask(id, date), { headers: { 'cache-control': 'public, s-maxage=300' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
