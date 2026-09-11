import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeSearchQuery, generatePreviewProspects, scoreProspects } from "@/lib/ai";
import { hasApify, searchGooglePlaces, searchLinkedInJobs, searchSocial, type RawProspect } from "@/lib/apify";
import { onboardingProgress, profiles, prospects, searches, workspaces } from "@/lib/db";
import type { PreviewProspect, ProspectSignal } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().min(3).max(200) });

// Free trial = a real but HARD-CAPPED taste of the product: one search only, a
// handful of real prospects from a single source (keeps Apify/Claude spend tiny),
// contact details locked. Wanting more → pick a plan. Falls back to a generated
// preview when Apify isn't configured so the funnel always works.
const FREE_MAX = 3;

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const query = parsed.data.query.trim();

  // One-shot: the free search runs the real (paid) pipeline exactly once per
  // account. A repeat call returns the stored preview — no extra Apify/Claude spend.
  if (ctx.workspace.freeSearchUsed && ctx.workspace.freeSearchPreview) {
    const p = ctx.workspace.freeSearchPreview;
    return NextResponse.json({
      query: ctx.workspace.freeSearchQuery ?? query,
      totalFound: ctx.workspace.freeSearchCount ?? p.length,
      visible: p.slice(0, FREE_MAX),
      lockedCount: 0,
    });
  }

  // Ensure a minimal profile exists (used for scoring + to satisfy requireProfile).
  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    await profiles.upsert(ctx.workspace.id, {
      saasName: ctx.workspace.name || "Mon activité",
      offer: query, valueProp: query, icp: query,
      competitors: [], competitorDiffs: [], tone: "direct",
      platforms: ["linkedin"], networks: [], goal: "leads",
      orgType: "smb", profileType: "other",
      preferredSources: ["google_maps", "linkedin_jobs"],
    });
  }

  let totalFound = 0;
  let preview: PreviewProspect[] = [];

  if (hasApify()) {
    // ---- Real, capped search ----
    let analysis;
    try {
      analysis = await analyzeSearchQuery(query);
    } catch {
      analysis = null;
    }
    if (analysis && analysis.intent === "prospect_search") {
      const search = await searches.create({
        workspaceId: ctx.workspace.id,
        query,
        intent: analysis.intent,
        criteria: analysis.criteria,
        sources: analysis.sources,
        title: analysis.title,
        totalResults: 0,
        qualifiedResults: 0,
        creditsUsed: 0,
        status: "running",
        isFirstSearch: true,
      });

      // ONE source only, capped to FREE_MAX — the whole point is to keep spend low.
      const primary = analysis.sources[0] ?? "linkedin_jobs";
      const SOCIAL = new Set(["instagram", "tiktok", "facebook", "twitter"]);
      let raws: RawProspect[] = [];
      try {
        if (primary === "google_maps") raws = await searchGooglePlaces(analysis.criteria, FREE_MAX);
        else if (SOCIAL.has(primary)) raws = await searchSocial(primary as "instagram" | "tiktok" | "facebook" | "twitter", analysis.criteria, FREE_MAX);
        else raws = await searchLinkedInJobs(analysis.criteria, FREE_MAX);
      } catch {
        raws = [];
      }
      raws = raws.slice(0, FREE_MAX);

      if (raws.length > 0) {
        const currentProfile = await profiles.findByWorkspace(ctx.workspace.id);
        const scores = currentProfile
          ? await scoreProspects(currentProfile, analysis.criteria, raws)
          : raws.map((r) => ({ fitScore: 72, fitReasoning: r.signalDescription ?? "" }));
        for (let i = 0; i < raws.length; i++) {
          const r = raws[i];
          const s = scores[i] ?? { fitScore: 70, fitReasoning: "" };
          const signals: ProspectSignal[] = r.signalDescription
            ? [{ level: s.fitScore > 80 ? "hot" : "warm", text: r.signalDescription }]
            : [];
          await prospects.create({
            workspaceId: ctx.workspace.id, searchId: search.id,
            companyName: r.companyName, companyDomain: r.companyDomain,
            companyLocation: r.companyLocation, companySector: r.companySector,
            contactName: r.contactName, contactEmail: null, contactPhone: r.phone ?? null,
            contactLinkedinUrl: r.contactLinkedinUrl, source: r.source,
            signalType: r.signalType, signalDescription: r.signalDescription, signalDate: r.signalDate,
            fitScore: s.fitScore, fitReasoning: s.fitReasoning, signals,
            stage: s.fitScore > 80 ? "hot" : "new", inPipeline: false,
          });
          preview.push({
            company: r.companyName,
            city: r.companyLocation ?? r.companySector ?? "",
            score: s.fitScore,
            signals: r.signalDescription ? [r.signalDescription] : [],
            why: s.fitReasoning || "",
            source: sourceLabel(r.source),
          });
        }
        totalFound = preview.length;
      }
      await searches.update(search.id, ctx.workspace.id, {
        status: "done", totalResults: totalFound, qualifiedResults: preview.filter((p) => p.score > 80).length, creditsUsed: 0,
      });
    }
  }

  // Fallback (no Apify, or nothing found): representative preview so the funnel works.
  if (preview.length === 0) {
    const gen = await generatePreviewProspects(query);
    preview = gen.prospects.slice(0, FREE_MAX);
    totalFound = preview.length;
  }

  await workspaces.setFreeSearch(ctx.workspace.id, { query, totalFound, prospects: preview });
  await onboardingProgress.complete(ctx.workspace.id);

  return NextResponse.json({
    query,
    totalFound,
    visible: preview.slice(0, FREE_MAX),
    lockedCount: 0,
  });
}

function sourceLabel(src: string): string {
  const map: Record<string, string> = {
    google_maps: "Google Maps", linkedin_jobs: "LinkedIn", linkedin_company: "LinkedIn",
    instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", twitter: "X / Twitter", reddit: "Reddit",
  };
  return map[src] ?? "Web";
}
