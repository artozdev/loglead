import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeSearchQuery } from "@/lib/ai";
import { insufficientResponse, spend } from "@/lib/creditGuard";
import { searches } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().trim().min(2).max(500) });

// Step 1 of a LogAgent search: detect intent, parse criteria, pick sources.
// For a prospect_search we charge `search_query` and persist a Search record;
// the prospects themselves are fetched by the streaming step (next call).
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  let analysis;
  try {
    analysis = await analyzeSearchQuery(parsed.data.query);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Only a prospect search consumes the search credit + creates a Search.
  if (analysis.intent !== "prospect_search") {
    return NextResponse.json({ analysis, search: null });
  }

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

  return NextResponse.json({ analysis, search, balance: charge.balance });
}
