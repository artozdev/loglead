import AlgoInsiderBoard from "@/components/AlgoInsiderBoard";
import { getAlgoInsights } from "@/lib/algo";
import { profiles } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function AlgoInsiderPage() {
  const { workspace, profile } = await requireProfile();
  // Onboarding checklist trigger: first visit of the Algo Insider (idempotent).
  if (!(profile.checklistSteps ?? []).includes("algo_insider")) {
    profiles.completeChecklistStep(workspace.id, "algo_insider");
  }
  const niche = profile.sector || profile.icp || "";
  const insights = await getAlgoInsights(workspace.id, profile);

  return (
    <AlgoInsiderBoard
      niche={niche}
      networks={insights.networks}
      generatedAt={insights.generatedAt}
      demo={insights.demo}
    />
  );
}
