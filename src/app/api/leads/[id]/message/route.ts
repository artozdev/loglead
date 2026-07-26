import { NextResponse } from "next/server";
import { draftLeadMessage } from "@/lib/ai";
import { contentItems, leads, profiles } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

// AI first-contact message — Pro feature.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "cmo")) {
    return NextResponse.json({ error: "La rédaction IA est réservée à l'offre Pro." }, { status: 403 });
  }

  const { id } = await params;
  const lead = await leads.findById(id, ctx.workspace.id);
  if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) return NextResponse.json({ error: "Profil manquant." }, { status: 400 });

  const sourceTitle = lead.sourceContentId
    ? (await contentItems.findById(lead.sourceContentId, ctx.workspace.id))?.title
    : undefined;

  try {
    const message = await draftLeadMessage({
      profile,
      firstName: lead.firstName,
      company: lead.company,
      channel: lead.channel,
      sourceTitle,
    });
    return NextResponse.json({ message });
  } catch (err) {
    const m = err instanceof Error ? err.message : "Rédaction impossible.";
    return NextResponse.json({ error: m }, { status: 502 });
  }
}
