import { NextResponse } from "next/server";

// Bulletproof logout: visit /logout in the address bar (or link to it) to sign
// out and land back on the landing page. Clears the session cookie directly on
// the redirect response so it always applies, even for a plain navigation.
export const dynamic = "force-dynamic";

const COOKIE_NAME = "loglead_session";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
