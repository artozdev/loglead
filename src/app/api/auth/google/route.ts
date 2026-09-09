import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, signIn } from "@/lib/auth";
import { users, workspaces } from "@/lib/db";
import { hasSupabase, supabase } from "@/lib/supabase";
import { setActiveWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ accessToken: z.string().min(10) });

// Bridge: verify the Google-issued Supabase access token, then find-or-create
// the user in the app's OWN store and set the app's `loglead_session` cookie.
// Everything downstream (onboarding, guards, dashboard) is unchanged.
export async function POST(req: Request) {
  if (!hasSupabase()) {
    return NextResponse.json({ error: "Authentification non configurée." }, { status: 503 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Validate the token against Supabase Auth → the verified Google user.
  const { data, error } = await supabase().auth.getUser(parsed.data.accessToken);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) {
    return NextResponse.json({ error: "Jeton Google invalide." }, { status: 401 });
  }
  const meta = (data.user.user_metadata ?? {}) as Record<string, string | undefined>;

  let user = await users.findByEmail(email);
  let isNew = false;
  if (!user) {
    isNew = true;
    // Google users have no password → an unguessable random hash (they sign in
    // via Google; they can set a password later via the reset flow).
    user = await users.create(email, hashPassword(randomUUID()));
    const workspace = await workspaces.create("Ma startup", user.id);
    await setActiveWorkspace(workspace.id);
    const avatar = meta.avatar_url ?? meta.picture;
    if (avatar) await users.updateAvatar(user.id, avatar);
  }

  await signIn(user.id);

  // New users start onboarding; existing users go to the app (guards route them
  // to the plan/onboarding step if they haven't finished).
  return NextResponse.json({ ok: true, redirect: isNew ? "/onboarding" : "/dashboard" });
}
