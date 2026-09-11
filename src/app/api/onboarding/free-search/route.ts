import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeSearchQuery, generatePreviewProspects, scoreProspects } from "@/lib/ai";
import { hasApify, searchGooglePlaces, searchLinkedInJobs, searchSocial, type RawProspect } from "@/lib/apify";
import { onboardingProgress, profiles, prospects, searches, workspaces } from "@/lib/db";
import type { PreviewProspect, Prospect, ProspectSignal } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().min(3).max(200) });

// Free trial = a real but HARD-CAPPED taste, run inside the LogAgent UI: one
// search only, a handful of real prospects from a single source (keeps Apify /
// Claude spend tiny), contacts locked. More requires a plan. Falls back to a
// generated preview when Apify isn't configured so the funnel always works.
const FREE_MAX = 3;

type Row = { id: string; fitScore: number; companyName: string; companyDomain: string | null; signalDescription: string | null; companyLocation: string | null };

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const query = parsed.data.query.trim();

  // One-shot: the free search runs the real (paid) pipeline exactly once per
  // account. A repeat call returns the stored preview — no extra Apify/Claude spend.
  if (ctx.workspace.freeSearchUsed && ctx.workspace.freeSearchPreview) {
    return NextResponse.json(payloadFromPreview(ctx.workspace.freeSearchQuery ?? query, ctx.workspace.freeSearchPreview, ctx.workspace.freeSearchCount ?? 0, true));
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

  let rows: Row[] = [];
  let title = query.slice(0, 60);
  let sources: string[] = [];
  const preview: PreviewProspect[] = [];

  if (hasApify()) {
    let analysis;
    try {
      analysis = await analyzeSearchQuery(query);
    } catch {
      analysis = null;
    }
    if (analysis && analysis.intent === "prospect_search") {
      title = analysis.title;
      sources = analysis.sources;
      const search = await searches.create({
        workspaceId: ctx.workspace.id, query, intent: analysis.intent,
        criteria: analysis.criteria, sources: analysis.sources, title: analysis.title,
        totalResults: 0, qualifiedResults: 0, creditsUsed: 0, status: "running", isFirstSearch: true,
      });
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
          const signals: ProspectSignal[] = r.signalDescription ? [{ level: s.fitScore > 80 ? "hot" : "warm", text: r.signalDescription }] : [];
          const p: Prospect = await prospects.create({
            workspaceId: ctx.workspace.id, searchId: search.id,
            companyName: r.companyName, companyDomain: r.companyDomain,
            companyLocation: r.companyLocation, companySector: r.companySector,
            contactName: r.contactName, contactEmail: null, contactPhone: r.phone ?? null,
            contactLinkedinUrl: r.contactLinkedinUrl, source: r.source,
            signalType: r.signalType, signalDescription: r.signalDescription, signalDate: r.signalDate,
            fitScore: s.fitScore, fitReasoning: s.fitReasoning, signals,
            stage: s.fitScore > 80 ? "hot" : "new", inPipeline: false,
          });
          rows.push({ id: p.id, fitScore: p.fitScore, companyName: p.companyName, companyDomain: p.companyDomain ?? null, signalDescription: p.signalDescription ?? null, companyLocation: p.companyLocation ?? null });
          preview.push({ company: p.companyName, city: p.companyLocation ?? "", score: p.fitScore, signals: p.signalDescription ? [p.signalDescription] : [], why: p.fitReasoning ?? "", source: p.source });
        }
      }
      await searches.update(search.id, ctx.workspace.id, { status: "done", totalResults: rows.length, qualifiedResults: rows.filter((p) => p.fitScore > 80).length, creditsUsed: 0 });
    }
  }

  // Fallback (no Apify / nothing found): representative preview.
  if (rows.length === 0) {
    const gen = await generatePreviewProspects(query);
    for (const p of gen.prospects.slice(0, FREE_MAX)) {
      rows.push({ id: cryptoId(), fitScore: p.score, companyName: p.company, companyDomain: null, signalDescription: p.signals[0] ?? null, companyLocation: p.city });
      preview.push(p);
    }
    if (!sources.length) sources = ["google_maps"];
  }

  await workspaces.setFreeSearch(ctx.workspace.id, { query, totalFound: rows.length, prospects: preview });
  await onboardingProgress.complete(ctx.workspace.id);

  return NextResponse.json({
    analysis: { intent: "prospect_search", title, sources, criteria: {} },
    prospects: rows,
    totalFound: rows.length,
    freeTrial: true,
  });
}

function payloadFromPreview(query: string, preview: PreviewProspect[], totalFound: number, freeTrial: boolean) {
  const rows: Row[] = preview.slice(0, FREE_MAX).map((p) => ({ id: cryptoId(), fitScore: p.score, companyName: p.company, companyDomain: null, signalDescription: p.signals[0] ?? null, companyLocation: p.city }));
  return {
    analysis: { intent: "prospect_search", title: query.slice(0, 60), sources: preview[0] ? [] : [], criteria: {} },
    prospects: rows,
    totalFound: totalFound || rows.length,
    freeTrial,
  };
}

function cryptoId() {
  return "fp_" + Math.random().toString(36).slice(2, 10);
}
