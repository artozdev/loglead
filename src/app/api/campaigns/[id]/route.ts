import { NextResponse } from "next/server";
import { campaignLeads } from "@/lib/campaign";
import { campaigns, contentItems } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "campaigns")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }
  const { id } = await params;
  const campaign = campaigns.findById(id, ctx.workspace.id);
  if (!campaign) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ campaign, rollup: campaignLeads(ctx.workspace.id, campaign) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "campaigns")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }
  const { id } = await params;
  const campaign = campaigns.findById(id, ctx.workspace.id);
  if (!campaign) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  // Also remove the scheduled content items this campaign created.
  for (const p of campaign.publications) {
    if (p.contentItemId) contentItems.remove(p.contentItemId, ctx.workspace.id);
  }
  campaigns.remove(id, ctx.workspace.id);
  return NextResponse.json({ ok: true });
}
