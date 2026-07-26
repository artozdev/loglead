import { NextResponse } from "next/server";
import { leadEvents, leads } from "@/lib/db";
import { scoreLead } from "@/lib/leadScore";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

// Recompute the qualification score on demand ("Recalculer" button, or lazy
// backfill when the sheet opens a lead that was never scored).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await leads.findById(id, ctx.workspace.id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const lead = await scoreLead(id, ctx.workspace.id);
  if (!lead) {
    return NextResponse.json(
      { error: "Impossible de calculer le score (profil manquant ?)." },
      { status: 502 },
    );
  }
  await leadEvents.create(id, "scored", { total: lead.score });
  return NextResponse.json({ lead });
}
