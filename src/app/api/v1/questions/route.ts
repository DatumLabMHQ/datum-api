import { keyOk, unauthorized } from '@/lib/auth';
import { QUESTIONS } from '@/lib/questions';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!keyOk(req)) return unauthorized();
  return Response.json({ questions: QUESTIONS.map((x) => ({ id: x.id, product: x.product, metric: x.metric, question: x.question, sql: x.sql, path: `/api/v1/ask/${x.id}?date=YYYY-MM-DD` })) }, { headers: { 'cache-control': 'public, s-maxage=3600' } });
}
