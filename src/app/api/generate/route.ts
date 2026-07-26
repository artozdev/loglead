import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFromBrief, isDemoMode } from "@/lib/ai";
import { contentItems, profiles } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { currentWorkspace } from "@/lib/workspace";

function firstNameOf(email: string) {
  const local = (email.split("@")[0] || email).replace(/[._-]+/g, " ").trim();
  return local.charAt(0).toUpperCase() + local.split(" ")[0].slice(1);
}

const schema = z.object({
  network: z.enum(["linkedin", "x", "instagram", "reddit"]),
  format: z.string().min(1),
  topic: z.string().optional().default(""),
  technique: z.string().optional(),
  tone: z.enum(["direct", "expert", "storytelling", "challenger", "fun"]).optional(),
  // Studio v3 wizard fields (optional — classic editor omits them).
  language: z.string().optional(),
  objective: z.string().optional(),
  audience: z.string().optional(),
  context: z.string().optional(),
  toneLabel: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Complète ton profil avant de générer." },
      { status: 400 },
    );
  }

  if (!rateLimit(`gen:${ctx.workspace.id}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Trop de générations d'affilée — réessaie dans une minute." },
      { status: 429 },
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
    const existingPosts = contentItems.listByWorkspace(ctx.workspace.id).map((c) => c.body);
    const variants = await generateFromBrief(profile, parsed.data, {
      firstName: firstNameOf(ctx.user.email),
      existingPosts,
    });
    return NextResponse.json({ variants, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de génération.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
