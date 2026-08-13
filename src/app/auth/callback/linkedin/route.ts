import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { workspaces } from "@/lib/db";
import { exchangeCode, fetchIdentity } from "@/lib/linkedin";
import { currentWorkspace } from "@/lib/workspace";

// LinkedIn OAuth callback — must match LINKEDIN_REDIRECT_URI
// (…/auth/callback/linkedin). Verifies the CSRF state, exchanges the code,
// stores the (encrypted) token on the workspace, redirects back to settings.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const back = (connected: boolean) =>
    NextResponse.redirect(
      new URL(`/settings?tab=connexions&connected=${connected}`, req.url),
    );

  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.redirect(new URL("/login", req.url));

  const cookieState = (await cookies()).get("li_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return back(false);
  }

  const token = await exchangeCode(code);
  if (!token) return back(false);

  const identity = await fetchIdentity(token.accessToken);
  if (!identity) return back(false);

  await workspaces.setLinkedIn(ctx.workspace.id, {
    accessToken: token.accessToken,
    memberSub: identity.sub,
    name: identity.name,
    expiresAt: new Date(Date.now() + token.expiresIn * 1000).toISOString(),
  });

  const res = back(true);
  res.cookies.delete("li_oauth_state");
  return res;
}
