import "server-only";
import { generateCmoBatch } from "./ai";
import { generateAnalytics, periodSummary } from "./analytics";
import { cmoActions } from "./db";
import type { CmoAction, Profile } from "./types";

// Loger's orchestrator: pulls the workspace's analytics + profile, asks the
// model for a batch of recommendations, and persists them to the feed.

const nf = new Intl.NumberFormat("fr-FR");
const delta = (cur: number, prev: number) =>
  prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / prev) * 100;
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(0)}%`;

export async function runCmo(
  workspaceId: string,
  profile: Profile,
  instruction?: string,
): Promise<CmoAction[]> {
  const daily = generateAnalytics(workspaceId, 180);
  const { current, previous } = periodSummary(daily, 7);
  const brief =
    `Vues ${nf.format(Math.round(current.views))} (${pct(delta(current.views, previous.views))}), ` +
    `Engagement ${nf.format(Math.round(current.engagement))} (${pct(delta(current.engagement, previous.engagement))}), ` +
    `Leads ${nf.format(Math.round(current.leads))} (${pct(delta(current.leads, previous.leads))})`;

  const items = await generateCmoBatch(profile, brief, instruction);
  for (const it of items) {
    await cmoActions.create(workspaceId, {
      type: it.type,
      title: it.title,
      message: it.message,
      body: it.body,
      platform: it.type === "content" ? it.platform : undefined,
      suggestedTime: it.type === "content" ? it.suggestedTime : undefined,
    });
  }
  return await cmoActions.listByWorkspace(workspaceId);
}
