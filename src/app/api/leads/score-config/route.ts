import { NextResponse } from "next/server";
import { z } from "zod";
import { leads, leadScoreConfig } from "@/lib/db";
import { scoreLead } from "@/lib/leadScore";
import { planAllows } from "@/lib/plan";
import { DEFAULT_SCORE_WEIGHTS, SCORE_CRITERIA } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const weightsSchema = z.object({
  profile: z.number().min(0).max(100),
  engagement: z.number().min(0).max(100),
  icp_match: z.number().min(0).max(100),
  reactivity: z.number().min(0).max(100),
  timing: z.number().min(0).max(100),
  ai_signals: z.number().min(0).max(100),
});

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }
  const weights = (await leadScoreConfig.get(ctx.workspace.id))?.weights ?? DEFAULT_SCORE_WEIGHTS;
  return NextResponse.json({ weights, criteria: SCORE_CRITERIA });
}

export async function PUT(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = weightsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const total = SCORE_CRITERIA.reduce((s, c) => s + parsed.data[c.value], 0);
  if (total <= 0) {
    return NextResponse.json(
      { error: "Au moins un critère doit avoir un poids supérieur à 0." },
      { status: 400 },
    );
  }

  const config = await leadScoreConfig.upsert(ctx.workspace.id, parsed.data);

  // Re-score every lead in the workspace so the new weighting takes effect
  // everywhere. Best-effort per lead (scoreLead never throws).
  const all = await leads.listByWorkspace(ctx.workspace.id);
  for (const l of all) {
    await scoreLead(l.id, ctx.workspace.id);
  }

  return NextResponse.json({ weights: config.weights, rescored: all.length });
}
