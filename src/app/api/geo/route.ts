import { NextResponse } from "next/server";
import { z } from "zod";
import { profiles, visibilityScans } from "@/lib/db";
import {
  buildActionPlan,
  buildCompetitorInsights,
  buildCompetitorScores,
  buildGeoMetrics,
  buildGeoQueries,
  buildGeoRows,
  buildRecommendations,
  scanGeoLLM,
  type GeoLLMOutcome,
} from "@/lib/visibility";
import type { Plan, VisibilityLLMResult } from "@/lib/types";
import { VISIBILITY_LLMS } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

// Per-plan caps: monthly scans, analyzed queries, tracked competitors,
// action plan and competitor source analysis.
const SCAN_QUOTA: Record<Plan, number> = { starter: 1, growth: 5, pro: Infinity };
const QUERY_CAP: Record<Plan, number> = { starter: 5, growth: 15, pro: 15 };
const COMPETITOR_CAP: Record<Plan, number> = { starter: 0, growth: 2, pro: Infinity };
const ACTION_PLAN_ALLOWED: Record<Plan, boolean> = { starter: false, growth: true, pro: true };
const INSIGHTS_ALLOWED: Record<Plan, boolean> = { starter: false, growth: false, pro: true };
const CUSTOM_QUERIES_ALLOWED: Record<Plan, boolean> = {
  starter: false,
  growth: false,
  pro: true,
};

const schema = z.object({
  url: z.string().min(4).max(300),
  extraQueries: z.array(z.string().min(3).max(200)).max(10).default([]),
});

// GET ?scanId=… — reload a past GEO report from the history list.
export async function GET(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const scanId = new URL(req.url).searchParams.get("scanId");
  const scan = visibilityScans
    .listByWorkspace(ctx.workspace.id)
    .find((s) => s.id === scanId && s.queryRows);
  if (!scan) return NextResponse.json({ error: "Scan introuvable." }, { status: 404 });
  return NextResponse.json({ scan });
}

// SSE stream: one `data: {llm, score, perQuery}` event per LLM as it answers,
// then a final `data: {done, ...scan}` event with rows, metrics and recos.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json({ error: "Complète d'abord ton profil SaaS." }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "URL invalide." }, { status: 400 });
  }
  const url = parsed.data.url.trim();

  const plan = ctx.workspace.plan;
  const used = visibilityScans.countThisMonth(ctx.workspace.id);
  const quota = SCAN_QUOTA[plan];
  if (used >= quota) {
    return NextResponse.json(
      {
        error: `Quota atteint : ${quota} scan${quota > 1 ? "s" : ""}/mois sur le plan ${plan}. Passe à l'offre supérieure pour scanner plus souvent.`,
      },
      { status: 403 },
    );
  }

  const queries = buildGeoQueries(profile, QUERY_CAP[plan]);
  if (CUSTOM_QUERIES_ALLOWED[plan]) {
    for (const q of parsed.data.extraQueries) {
      if (!queries.some((x) => x.query === q)) queries.push({ query: q, group: "niche" });
    }
  }

  const workspaceId = ctx.workspace.id;
  const scanIndex = visibilityScans.listByWorkspace(workspaceId).length;
  const withRecommendations = plan !== "starter";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      // Site check first — instant, but gives the loading list its first ✅.
      send({ stage: "site" });

      const outcomes: GeoLLMOutcome[] = [];

      // All 6 LLMs in parallel; each event is pushed the moment it resolves.
      await Promise.allSettled(
        VISIBILITY_LLMS.map(async ({ value: llm }) => {
          const outcome = await scanGeoLLM({ llm, queries, profile, url, workspaceId, scanIndex });
          outcomes.push(outcome);
          send({ llm, score: outcome.score, demo: outcome.demo });
        }),
      );

      const rows = buildGeoRows(outcomes, queries, profile);
      const metrics = buildGeoMetrics(rows);
      const llmScores = Object.fromEntries(outcomes.map((o) => [o.llm, o.score]));

      // Competitor tracking (plan-capped), then the action plan.
      const competitors = profile.competitors.filter(Boolean).slice(0, COMPETITOR_CAP[plan]);
      const competitorScores = buildCompetitorScores(outcomes, competitors);
      const competitorInsights = INSIGHTS_ALLOWED[plan]
        ? buildCompetitorInsights(competitorScores, rows, profile)
        : [];
      send({ stage: "competitors" });

      const actionPlan = ACTION_PLAN_ALLOWED[plan]
        ? buildActionPlan({ profile, rows, llmScores, competitorScores })
        : [];
      send({ stage: "plan" });

      // Legacy per-LLM results kept so old consumers (dashboard KPI) still work.
      const results: VisibilityLLMResult[] = outcomes.map((o) => {
        const bestQ = [...o.perQuery].sort(
          (a, b) =>
            (b.status === "mentioned" ? 2 : b.status === "partial" ? 1 : 0) -
            (a.status === "mentioned" ? 2 : a.status === "partial" ? 1 : 0),
        )[0];
        return {
          llm: o.llm,
          status: bestQ?.status ?? "not_detected",
          query: bestQ?.query ?? "",
          excerpt: bestQ?.excerpt ?? "",
          position: null,
          tone: null,
          demo: o.demo,
        };
      });

      const recommendations = withRecommendations
        ? buildRecommendations(results, profile)
        : [];

      const scan = visibilityScans.create(workspaceId, {
        url,
        results,
        globalScore: metrics.globalScore,
        recommendations,
        queryRows: rows,
        llmScores,
        competitorScores,
        competitorInsights,
        actionPlan,
      });

      send({
        done: true,
        scanId: scan.id,
        globalScore: metrics.globalScore,
        llmScores,
        rows,
        metrics,
        recommendations,
        competitorScores,
        competitorInsights,
        actionPlan,
        demo: outcomes.some((o) => o.demo),
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
