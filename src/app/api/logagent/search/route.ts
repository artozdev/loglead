import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeSearchQuery, scoreProspects } from "@/lib/ai";
import { hasApify, searchGooglePlaces, searchLinkedInJobs, type RawProspect } from "@/lib/apify";
import { insufficientResponse, spend } from "@/lib/creditGuard";
import { credits, profiles, prospects, searches } from "@/lib/db";
import type { ProspectSignal } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().trim().min(2).max(500) });
const MAX_RESULTS = 15;

// LogAgent search: detect intent → parse criteria → run the right scrapers →
// score with Claude → persist prospects. Charges search_query + the source(s).
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  let analysis;
  try {
    analysis = await analyzeSearchQuery(parsed.data.query);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Analyse impossible." }, { status: 502 });
  }

  if (analysis.intent !== "prospect_search") {
    return NextResponse.json({ analysis, search: null, prospects: [] });
  }
  if (!hasApify()) {
    return NextResponse.json({ error: "Apify n'est pas configuré." }, { status: 503 });
  }

  // Charge the base search cost.
  const charge = await spend(ctx.workspace.id, "search_query");
  if (!charge.ok) return insufficientResponse("search_query", charge.balance);

  const search = await searches.create({
    workspaceId: ctx.workspace.id,
    query: parsed.data.query,
    intent: analysis.intent,
    criteria: analysis.criteria,
    sources: analysis.sources,
    title: analysis.title,
    totalResults: 0,
    qualifiedResults: 0,
    creditsUsed: 20,
    status: "running",
  });

  // Run the relevant scrapers (best-effort, in parallel).
  const runs: Promise<RawProspect[]>[] = [];
  if (analysis.sources.includes("google_maps")) runs.push(searchGooglePlaces(analysis.criteria, MAX_RESULTS));
  if (analysis.sources.includes("linkedin_jobs")) runs.push(searchLinkedInJobs(analysis.criteria, MAX_RESULTS));
  if (runs.length === 0) runs.push(searchLinkedInJobs(analysis.criteria, MAX_RESULTS)); // default

  let raws: RawProspect[] = [];
  try {
    raws = (await Promise.all(runs)).flat().slice(0, MAX_RESULTS);
  } catch {
    raws = [];
  }

  // Charge each source used (best-effort — the results are already fetched).
  let creditsUsed = 20;
  const usedGmaps = analysis.sources.includes("google_maps");
  const usedLinkedin = analysis.sources.includes("linkedin_jobs") || !usedGmaps;
  if (raws.length > 0) {
    if (usedGmaps) { await credits.consume(ctx.workspace.id, "search_google_maps", 30); creditsUsed += 30; }
    if (usedLinkedin) { await credits.consume(ctx.workspace.id, "search_linkedin", 40); creditsUsed += 40; }
  }

  if (raws.length === 0) {
    await searches.update(search.id, ctx.workspace.id, { status: "done", totalResults: 0 });
    return NextResponse.json({ analysis, search, prospects: [], balance: charge.balance });
  }

  // Score with Claude.
  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  const scores = profile
    ? await scoreProspects(profile, analysis.criteria, raws)
    : raws.map((r) => ({ fitScore: 60, fitReasoning: r.signalDescription ?? "" }));

  // Persist.
  const created = [];
  for (let i = 0; i < raws.length; i++) {
    const r = raws[i];
    const s = scores[i] ?? { fitScore: 60, fitReasoning: "" };
    const signals: ProspectSignal[] = r.signalDescription
      ? [{ level: s.fitScore > 80 ? "hot" : "warm", text: r.signalDescription }]
      : [];
    const p = await prospects.create({
      workspaceId: ctx.workspace.id,
      searchId: search.id,
      companyName: r.companyName,
      companyDomain: r.companyDomain,
      companyLocation: r.companyLocation,
      companySector: r.companySector,
      contactName: r.contactName,
      contactEmail: null,
      contactPhone: r.phone ?? null,
      contactLinkedinUrl: r.contactLinkedinUrl,
      source: r.source,
      signalType: r.signalType,
      signalDescription: r.signalDescription,
      signalDate: r.signalDate,
      fitScore: s.fitScore,
      fitReasoning: s.fitReasoning,
      signals,
      stage: s.fitScore > 80 ? "hot" : "new",
      inPipeline: false,
    });
    created.push(p);
  }

  const qualified = created.filter((p) => p.fitScore > 80).length;
  await searches.update(search.id, ctx.workspace.id, {
    status: "done",
    totalResults: created.length,
    qualifiedResults: qualified,
    creditsUsed,
  });

  return NextResponse.json({ analysis, search, prospects: created });
}
