import { NextResponse } from "next/server";
import { z } from "zod";
import { leads as leadsRepo, segments as segmentsRepo } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { leadsInSegment, segmentMetrics } from "@/lib/segments";
import { currentWorkspace } from "@/lib/workspace";

const criteriaSchema = z.object({
  sectors: z.array(z.string()).optional(),
  channels: z.array(z.enum(["reddit", "linkedin", "x", "instagram", "website", "manual"])).optional(),
  statuses: z.array(z.enum(["new", "contacted", "in_discussion", "converted", "lost"])).optional(),
  minScore: z.number().int().optional(),
});

const createSchema = z.object({
  name: z.string().min(1, "Le nom du segment est requis."),
  description: z.string().optional(),
  type: z.enum(["auto", "manual", "competitor_audience"]).default("manual"),
  criteria: criteriaSchema.default({}),
});

// GET — segments with computed metrics + workspace-level totals.
export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const allLeads = leadsRepo.listByWorkspace(ctx.workspace.id);
  const segs = segmentsRepo.listByWorkspace(ctx.workspace.id);
  const rows = segs.map((s) => ({ segment: s, metrics: segmentMetrics(leadsInSegment(allLeads, s)) }));

  const active = segs.filter((s) => !s.isArchived);
  return NextResponse.json({
    segments: rows,
    totals: {
      segments: active.length,
      active: active.length,
      totalLeads: allLeads.length,
      archived: segs.filter((s) => s.isArchived).length,
    },
  });
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const segment = segmentsRepo.create(ctx.workspace.id, parsed.data);
  return NextResponse.json({ segment });
}
