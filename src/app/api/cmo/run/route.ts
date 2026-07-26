import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/ai";
import { cmoConfig, profiles } from "@/lib/db";
import { runCmo } from "@/lib/cmo";
import { currentWorkspace } from "@/lib/workspace";

export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (ctx.workspace.plan !== "pro") {
    return NextResponse.json({ error: "Réservé à l'offre Pro." }, { status: 403 });
  }

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Complète ton profil de marque d'abord." },
      { status: 400 },
    );
  }

  try {
    const config = await cmoConfig.get(ctx.workspace.id);
    const actions = await runCmo(ctx.workspace.id, profile, config.lastInstruction);
    return NextResponse.json({ actions, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Loger n'a pas pu travailler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
