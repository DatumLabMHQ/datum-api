// Optional API key. When DATUM_API_KEYS (comma-separated) is set, every request must carry one
// as `x-api-key`, `Authorization: Bearer`, or `?key=`. Unset means the API is open.
export function keyOk(req: Request): boolean {
  const keys = (process.env.DATUM_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (!keys.length) return true;
  const h = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || new URL(req.url).searchParams.get('key');
  return Boolean(h && keys.includes(h));
}
export function unauthorized(): Response {
  return Response.json({ error: 'unauthorized', hint: 'send x-api-key, Authorization: Bearer <key>, or ?key=' }, { status: 401 });
}
