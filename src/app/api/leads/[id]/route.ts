import { NextResponse } from "next/server";
import { z } from "zod";
import { leadEvents, leads, leadScoreConfig, type LeadInput } from "@/lib/db";
import { scoreLead } from "@/lib/leadScore";
import { planAllows } from "@/lib/plan";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }
  const { id } = await params;
  const lead = leads.findById(id, ctx.workspace.id);
  if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const weights = leadScoreConfig.get(ctx.workspace.id)?.weights ?? DEFAULT_SCORE_WEIGHTS;
  return NextResponse.json({ lead, events: leadEvents.listByLead(id), weights });
}

const patchSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    company: z.string(),
    jobTitle: z.string(),
    linkedinUrl: z.string(),
    notes: z.string(),
    status: z.enum(["new", "contacted", "in_discussion", "converted", "lost"]),
    sourceContentId: z.string().nullish(),
  })
  .partial();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const { id } = await params;
  const existing = leads.findById(id, ctx.workspace.id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const d = parsed.data;

  const patch: Partial<LeadInput> = {};
  for (const k of ["firstName", "lastName", "company", "jobTitle", "linkedinUrl", "notes", "status"] as const) {
    if (d[k] !== undefined) (patch as Record<string, unknown>)[k] = d[k];
  }
  if (d.email !== undefined) patch.email = d.email || null;
  if (d.phone !== undefined) patch.phone = d.phone || null;
  if (d.sourceContentId !== undefined) patch.sourceContentId = d.sourceContentId || null;

  let lead = leads.update(id, ctx.workspace.id, patch);

  const statusChanged = Boolean(d.status && d.status !== existing.status);
  const noteChanged = d.notes !== undefined && d.notes !== (existing.notes ?? "");
  if (statusChanged) {
    leadEvents.create(id, "status_changed", { from: existing.status, to: d.status });
  }
  if (noteChanged) {
    leadEvents.create(id, "note_added", {});
  }

  // Recompute the qualification score on every meaningful interaction. Events
  // are logged first so the new interaction is reflected in the score.
  if (statusChanged || noteChanged) {
    lead = (await scoreLead(id, ctx.workspace.id)) ?? lead;
  }
  return NextResponse.json({ lead });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const { id } = await params;
  const ok = leads.remove(id, ctx.workspace.id);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
