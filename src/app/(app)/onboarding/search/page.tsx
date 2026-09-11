import { redirect } from "next/navigation";
import LogAgent from "@/components/LogAgent";
import { profiles } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";

// Free-trial generation — runs inside the real LogAgent UI (same design), capped
// to one search. Onboarding (profile) is mandatory before reaching here; picking
// a plan is required to go further. Uses requireWorkspace so the trial (no plan
// yet) can access this one screen.
export default async function OnboardingSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  if (workspace.planChosen) redirect("/dashboard");
  const profile = await profiles.findByWorkspace(workspace.id);
  if (!profile) redirect("/onboarding");

  const { q } = await searchParams;
  const initialQuery = (q ?? workspace.freeSearchQuery ?? "").slice(0, 200);

  return <LogAgent freeTrial initialQuery={initialQuery} />;
}
