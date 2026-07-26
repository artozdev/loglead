import "server-only";
import { contentItems } from "./db";
import type { Profile } from "./types";

// ---------------------------------------------------------------------------
// Onboarding checklist state (dashboard getting-started block).
// Steps: profile · algo_insider · studio · calendar · connections.
// Most steps are DERIVED live from the data (no triggers to maintain); only
// "algo_insider" (pageview) and "connections" are persisted markers in
// profile.checklistSteps (written via /api/checklist or the page visit).
// ---------------------------------------------------------------------------

export type ChecklistData = {
  visible: boolean;
  completed: string[]; // step ids
};

export async function buildChecklist(workspaceId: string, profile: Profile): Promise<ChecklistData> {
  if (profile.checklistDismissed) return { visible: false, completed: [] };

  const completed = new Set(profile.checklistSteps ?? []);
  const content = await contentItems.listByWorkspace(workspaceId);

  if (profile.siteUrl) completed.add("profile");
  if (content.length > 0) completed.add("studio");
  if (content.some((c) => c.scheduledDate)) completed.add("calendar");

  return { visible: true, completed: [...completed] };
}
