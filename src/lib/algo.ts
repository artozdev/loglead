import "server-only";
import { generateAlgoInsights, isDemoMode } from "./ai";
import { algoInsights as repo } from "./db";
import type { AlgoInsights, Profile } from "./types";

// Algo Insider orchestrator: the guide is generated once and cached per
// workspace, then auto-refreshed monthly (the brief: "Mise à jour mensuelle
// automatique"). A manual refresh forces regeneration.

function sameMonth(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function isFresh(insights: AlgoInsights | undefined, now = new Date()): boolean {
  return Boolean(insights && sameMonth(insights.generatedAt, now));
}

// Returns cached insights when fresh (same month) unless `force`; otherwise
// regenerates via Claude (or the demo mock) and persists.
export async function getAlgoInsights(
  workspaceId: string,
  profile: Profile,
  opts: { force?: boolean } = {},
): Promise<AlgoInsights> {
  const existing = await repo.get(workspaceId);
  if (!opts.force && isFresh(existing)) return existing!;

  const networks = await generateAlgoInsights(profile);
  return await repo.upsert(workspaceId, {
    generatedAt: new Date().toISOString(),
    demo: isDemoMode(),
    networks,
  });
}
