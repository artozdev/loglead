import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePreviewProspects } from "@/lib/ai";
import { onboardingProgress, profiles, workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().min(3).max(200) });

// The free onboarding search: generates a representative preview (no scraping,
// no credits), stores it on the workspace and creates a minimal profile so the
// account is usable. Returns 3 unlocked prospects + the locked count.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const query = parsed.data.query.trim();

  const { totalFound, prospects } = await generatePreviewProspects(query);

  // Minimal profile from the query so requireProfile passes (refined later in Settings).
  const existing = await profiles.findByWorkspace(ctx.workspace.id);
  if (!existing) {
    await profiles.upsert(ctx.workspace.id, {
      saasName: ctx.workspace.name || "Mon activité",
      offer: query,
      valueProp: query,
      icp: query,
      competitors: [],
      competitorDiffs: [],
      tone: "direct",
      platforms: ["linkedin"],
      networks: [],
      goal: "leads",
      orgType: "smb",
      profileType: "other",
      preferredSources: ["google_maps", "linkedin_jobs"],
    });
  }

  await workspaces.setFreeSearch(ctx.workspace.id, { query, totalFound, prospects });
  await onboardingProgress.complete(ctx.workspace.id);

  return NextResponse.json({
    query,
    totalFound,
    visible: prospects.slice(0, 3),
    lockedCount: Math.max(0, totalFound - 3),
  });
}
