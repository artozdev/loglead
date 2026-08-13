import { NextResponse } from "next/server";
import { draftLeadMessage } from "@/lib/ai";
import { insufficientResponse, spend } from "@/lib/creditGuard";
import { contentItems, leadEvents, leads, profiles, type LeadInput } from "@/lib/db";
import { enrichLinkedInProfile, hasApify } from "@/lib/apify";
import { domainFromUrl, enrichContact, hasFullEnrich } from "@/lib/fullenrich";
import { scoreLead } from "@/lib/leadScore";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

// Enrichment — Pro. Email/phone come from FullEnrich (waterfall) when a key is
// set; without a key we fall back to a mock email so the dev flow still works.
// Firmographics (sector/size/interests) stay heuristic until Apollo is wired.
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
  const lead = await leads.findById(id, ctx.workspace.id);
  if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Charge credits before enriching (Part 9, rule 1).
  const charge = await spend(ctx.workspace.id, "enrich_lead_full");
  if (!charge.ok) return insufficientResponse("enrich_lead_full", charge.balance);

  const profile = await profiles.findByWorkspace(ctx.workspace.id);

  const patch: Partial<LeadInput> = {};

  // Email + phone via FullEnrich (waterfall). Falls back to a mock email only
  // when no key is configured, so we never overwrite a real gap with fake data.
  if (!lead.email || !lead.phone) {
    if (hasFullEnrich()) {
      const found = await enrichContact({
        firstName: lead.firstName,
        lastName: lead.lastName,
        companyName: lead.company,
        domain: domainFromUrl(lead.siteUrl) ?? domainFromUrl(lead.email),
        linkedinUrl: lead.linkedinUrl,
      });
      if (!lead.email && (found?.workEmail || found?.personalEmail)) {
        patch.email = found.workEmail ?? found.personalEmail;
      }
      if (!lead.phone && found?.phone) patch.phone = found.phone;
    } else if (!lead.email) {
      patch.email = mockEmail(lead.firstName, lead.lastName, lead.company);
    }
  }

  // Firmographics from the public LinkedIn profile via Apify (best-effort).
  if (hasApify() && lead.linkedinUrl && (!lead.jobTitle || !lead.company || !lead.sector)) {
    const li = await enrichLinkedInProfile(lead.linkedinUrl);
    if (li) {
      if (!lead.jobTitle && li.jobTitle) patch.jobTitle = li.jobTitle;
      if (!lead.company && li.company) patch.company = li.company;
      if (!lead.sector && li.sector) patch.sector = li.sector;
    }
  }

  // Heuristic fallbacks for anything still missing (Apify or a real value wins).
  if (!lead.jobTitle && !patch.jobTitle) patch.jobTitle = "Founder";
  if (!lead.sector && !patch.sector) patch.sector = profile?.sector || "SaaS B2B";
  if (!lead.companySize) patch.companySize = "1-10 employés";
  if (!lead.interests?.length) {
    patch.interests = mockInterests(`${lead.company ?? ""}${lead.firstName}`);
  }
  patch.enrichedAt = new Date().toISOString();
  const updated = await leads.update(id, ctx.workspace.id, patch) ?? lead;

  const sourceTitle = lead.sourceContentId
    ? (await contentItems.findById(lead.sourceContentId, ctx.workspace.id))?.title
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

  await leadEvents.create(id, "enriched", { foundEmail: Boolean(patch.email) });
  // Fresh firmographics → recompute the qualification score.
  const scored = await scoreLead(id, ctx.workspace.id);
  return NextResponse.json({ lead: scored ?? updated, message });
}
