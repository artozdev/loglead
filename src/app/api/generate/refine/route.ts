import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, refineVariant } from "@/lib/ai";
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
  content: z.string().min(1),
  mode: z.enum(["improve", "angle"]),
  improvements: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) return NextResponse.json({ error: "Profil requis." }, { status: 400 });

  if (!rateLimit(`gen:${ctx.workspace.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de générations d'affilée — réessaie dans une minute." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide" }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const existingPosts = contentItems.listByWorkspace(ctx.workspace.id).map((c) => c.body);
    const variant = await refineVariant(
      profile,
      { network: d.network, format: d.format, topic: d.topic, technique: d.technique },
      { firstName: firstNameOf(ctx.user.email), existingPosts },
      { content: d.content, mode: d.mode, improvements: d.improvements },
    );
    return NextResponse.json({ variant, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Régénération impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
