import { NextResponse } from "next/server";
import { leadEvents, leads } from "@/lib/db";
import { scoreLead } from "@/lib/leadScore";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

// Logs that the founder sent a first-contact email (timeline event).
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
  const lead = leads.findById(id, ctx.workspace.id);
  if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Move to "contacted" if still new.
  if (lead.status === "new") {
    leads.update(id, ctx.workspace.id, { status: "contacted" });
    leadEvents.create(id, "status_changed", { from: "new", to: "contacted" });
  }
  leadEvents.create(id, "email_sent", {});
  await scoreLead(id, ctx.workspace.id);
  return NextResponse.json({ ok: true });
}
