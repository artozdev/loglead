import { NextResponse } from "next/server";
import { getAlgoInsights } from "@/lib/algo";
import { profiles } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// POST /api/algo — (re)generate the Algo Insider guide for the active workspace.
export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Complète ton profil de marque d'abord." },
      { status: 400 },
    );
  }

  try {
    const insights = await getAlgoInsights(ctx.workspace.id, profile, { force: true });
    return NextResponse.json({ insights });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Génération impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
