import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, suggestAngles } from "@/lib/ai";
import { profiles } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  network: z.enum(["linkedin", "x", "instagram", "reddit"]),
  objective: z.string().optional(),
});

// POST — 3 AI-suggested angles for the Studio wizard (step 5).
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) return NextResponse.json({ error: "Profil requis." }, { status: 400 });

  if (!rateLimit(`gen:${ctx.workspace.id}`, 12, 60_000)) {
    return NextResponse.json(
      { error: "Trop de requêtes d'affilée — réessaie dans un instant." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    const angles = await suggestAngles(profile, parsed.data.network, parsed.data.objective);
    return NextResponse.json({ angles, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Suggestion impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
