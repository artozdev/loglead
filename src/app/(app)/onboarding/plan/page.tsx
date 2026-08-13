import { redirect } from "next/navigation";
import PlanSelection from "@/components/PlanSelection";
import { profiles } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";

// Mandatory plan screen shown right after onboarding. Uses requireWorkspace
// (not requireProfile) so the plan gate can't loop back here.
export default async function OnboardingPlanPage() {
  const { workspace } = await requireWorkspace();
  const profile = await profiles.findByWorkspace(workspace.id);
  if (!profile) redirect("/onboarding");
  if (workspace.planChosen) redirect("/dashboard");
  return <PlanSelection />;
}
