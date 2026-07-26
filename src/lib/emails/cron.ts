import "server-only";

// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. When the env var
// is unset (local dev), the routes stay open so they can be tested by hand.
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
