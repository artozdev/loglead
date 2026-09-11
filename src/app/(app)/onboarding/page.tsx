import { redirect } from "next/navigation";
import FreeSearchOnboarding from "@/components/FreeSearchOnboarding";
import { requireWorkspace } from "@/lib/guards";

// Post-signup free-search funnel. Fully onboarded (plan chosen) → the app. If the
// free search was already run, we resume straight on the results/conversion view.
export default async function OnboardingPage() {
  const { workspace } = await requireWorkspace();
  if (workspace.planChosen) redirect("/dashboard");

  const preview = workspace.freeSearchPreview;
  const initial =
    workspace.freeSearchUsed && preview
      ? {
          query: workspace.freeSearchQuery ?? "",
          totalFound: workspace.freeSearchCount ?? preview.length,
          visible: preview.slice(0, 3),
          lockedCount: Math.max(0, (workspace.freeSearchCount ?? preview.length) - 3),
        }
      : null;

  return <FreeSearchOnboarding initial={initial} />;
}
