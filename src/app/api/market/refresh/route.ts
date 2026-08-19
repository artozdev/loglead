import { NextResponse } from "next/server";
import { analyzeMarket } from "@/lib/ai";
import { hasApify, searchLinkedInPosts, type MarketPost } from "@/lib/apify";
import { insufficientResponse, spend } from "@/lib/creditGuard";
import { marketReports, profiles } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// Apify + Claude both need Node + no caching.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Refresh Market Intelligence: scrape recent LinkedIn posts for the workspace's
// sector/competitors (Apify), analyze them with Claude, store one report per
// workspace. Charges `refresh_market_data` credits only once posts are found.
export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!hasApify()) {
    return NextResponse.json(
      { error: "Apify n'est pas configuré (APIFY_API_TOKEN manquant)." },
      { status: 503 },
    );
  }

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json({ error: "Profil requis." }, { status: 400 });
  }

  // Build search queries from the business profile: sector + top competitors.
  const comps = (profile.competitors ?? []).filter(Boolean);
  const queries = Array.from(
    new Set([profile.sector, ...comps.slice(0, 2)].filter(Boolean) as string[]),
  );
  if (queries.length === 0) queries.push(profile.saasName);

  // Scrape first — don't charge if Apify returns nothing.
  let posts: MarketPost[];
  try {
    posts = await searchLinkedInPosts(queries, { maxPosts: 15, postedLimit: "month" });
  } catch {
    posts = [];
  }
  if (posts.length === 0) {
    return NextResponse.json(
      { error: "Aucun post LinkedIn trouvé pour ton marché. Réessaie plus tard." },
      { status: 502 },
    );
  }

  // Charge credits now that we have data to analyze (Part 9, rule 1).
  const charge = await spend(ctx.workspace.id, "refresh_market_data");
  if (!charge.ok) return insufficientResponse("refresh_market_data", charge.balance);

  let analysis;
  try {
    analysis = await analyzeMarket(profile, posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const report = await marketReports.save({
    workspaceId: ctx.workspace.id,
    ...analysis,
    postsAnalyzed: posts.length,
    queries,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ report, balance: charge.balance });
}

// Current stored report (no scraping, no charge).
export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const report = await marketReports.get(ctx.workspace.id);
  return NextResponse.json({ report });
}
