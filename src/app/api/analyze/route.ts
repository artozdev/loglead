import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/ai";
import { runAnalysis } from "@/lib/analyze";
import { profiles } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  url: z.string().optional().default(""),
  text: z
    .string()
    .min(30, "Colle le texte du post ou la transcription de la vidéo (30 caractères min)."),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Complète ton profil de marque d'abord." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  try {
    const analysis = await runAnalysis(ctx.workspace.id, profile, parsed.data);
    return NextResponse.json({ analysis, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
