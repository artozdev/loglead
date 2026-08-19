import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, hasLinkedInOAuth } from "@/lib/linkedin";
import { currentWorkspace } from "@/lib/workspace";

// Kick off the LinkedIn OAuth flow: set a CSRF state cookie, redirect to the
// LinkedIn consent screen. The callback lives at /auth/callback/linkedin.
export async function GET(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.redirect(new URL("/login", req.url));
  if (!hasLinkedInOAuth()) {
    // Diagnostic (booleans only, no secret values) — tells us which var the
    // deployed environment is actually missing.
    return NextResponse.json(
      {
        error: "LinkedIn OAuth non configuré (variables d'env manquantes).",
        present: {
          LINKEDIN_CLIENT_ID: Boolean(process.env.LINKEDIN_CLIENT_ID),
          LINKEDIN_CLIENT_SECRET: Boolean(process.env.LINKEDIN_CLIENT_SECRET),
          LINKEDIN_REDIRECT_URI: Boolean(process.env.LINKEDIN_REDIRECT_URI),
        },
      },
      { status: 500 },
    );
  }

  const state = randomUUID();
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("li_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
