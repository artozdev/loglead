import { NextResponse } from "next/server";
import { draftLeadMessage } from "@/lib/ai";
import { contentItems, leadEvents, leads, profiles, type LeadInput } from "@/lib/db";
import { scoreLead } from "@/lib/leadScore";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

// Enrichment — Pro. Hunter/Apollo are mocked; the message is real Claude.
function mockEmail(first: string, last: string, company?: string): string {
  const dom = (company || "entreprise").toLowerCase().replace(/[^a-z0-9]/g, "") || "entreprise";
  return `${first.toLowerCase()}.${last.toLowerCase()}@${dom}.com`.replace(/\.@/, "@");
}

// Stand-in firmographics + interests, deterministic per company so a lead's
// enriched card is stable across reloads (Clearbit/Apollo would replace this).
function mockInterests(seed: string): string[] {
  const pool = [
    "Marketing organique",
    "Distribution SaaS",
    "Build in public",
    "LinkedIn growth",
    "Contenu B2B",
    "Acquisition leads",
    "GEO / IA",
    "Product-led growth",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const start = h % pool.length;
  return [pool[start], pool[(start + 2) % pool.length], pool[(start + 4) % pool.length]];
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "cmo")) {
    return NextResponse.json({ error: "L'enrichissement IA est réservé à l'offre Pro." }, { status: 403 });
  }

  const { id } = await params;
  const lead = leads.findById(id, ctx.workspace.id);
  if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const profile = profiles.findByWorkspace(ctx.workspace.id);

  const patch: Partial<LeadInput> = {};
  if (!lead.email) patch.email = mockEmail(lead.firstName, lead.lastName, lead.company);
  if (!lead.jobTitle) patch.jobTitle = "Founder";
  if (!lead.sector) patch.sector = profile?.sector || "SaaS B2B";
  if (!lead.companySize) patch.companySize = "1-10 employés";
  if (!lead.interests?.length) {
    patch.interests = mockInterests(`${lead.company ?? ""}${lead.firstName}`);
  }
  patch.enrichedAt = new Date().toISOString();
  const updated = leads.update(id, ctx.workspace.id, patch) ?? lead;

  const sourceTitle = lead.sourceContentId
    ? contentItems.findById(lead.sourceContentId, ctx.workspace.id)?.title
    : undefined;
  let message = null;
  try {
    if (profile) {
      message = await draftLeadMessage({
        profile,
        firstName: lead.firstName,
        company: updated?.company,
        channel: lead.channel,
        sourceTitle,
      });
    }
  } catch {
    /* message is best-effort */
  }

  leadEvents.create(id, "enriched", { foundEmail: Boolean(patch.email) });
  // Fresh firmographics → recompute the qualification score.
  const scored = await scoreLead(id, ctx.workspace.id);
  return NextResponse.json({ lead: scored ?? updated, message });
}
