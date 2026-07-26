import { NextResponse } from "next/server";
import { z } from "zod";
import { profiles, workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  saasName: z.string().min(1, "Nom du SaaS requis"),
  offer: z.string().min(1, "Offre requise"),
  valueProp: z.string().min(1, "Proposition de valeur requise"),
  icp: z.string().min(1, "Audience cible requise"),
  sector: z.string().optional().default(""),
  siteUrl: z.string().optional().default(""),
  competitors: z.array(z.string()).max(3).default([]),
  tone: z.enum(["direct", "expert", "storytelling", "challenger", "fun"]),
  platforms: z
    .array(z.enum(["linkedin", "instagram", "tiktok"]))
    .min(1, "Choisis au moins une plateforme"),
  networks: z.array(z.enum(["linkedin", "x", "instagram", "reddit"])).default([]),
  goal: z.enum(["notoriety", "leads", "recruiting", "convert", "both"]),
});

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({
    profile: profiles.findByWorkspace(ctx.workspace.id) ?? null,
  });
}

export async function PUT(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const competitors = parsed.data.competitors
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);

  const profile = profiles.upsert(ctx.workspace.id, {
    ...parsed.data,
    competitors,
  });
  // Keep the workspace name in sync with the brand (names the first workspace).
  workspaces.rename(ctx.workspace.id, parsed.data.saasName);

  return NextResponse.json({ profile });
}
