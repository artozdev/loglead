import { redirect } from "next/navigation";
import OnboardingV2 from "@/components/OnboardingV2";
import { profiles } from "@/lib/db";
import { firstNameFromEmail } from "@/lib/emails/send";
import { requireWorkspace } from "@/lib/guards";

// Mandatory onboarding (build the profile). Once done, the free-trial generation
// happens in the LogAgent UI (/onboarding/search); a plan is required to go on.
export default async function OnboardingPage() {
  const { user, workspace } = await requireWorkspace();
  const profile = await profiles.findByWorkspace(workspace.id);
  if (profile) {
    redirect(workspace.planChosen ? "/dashboard" : "/onboarding/search");
  }

  const local = (user.email.split("@")[0] || "").replace(/[._-]+/g, " ").trim();
  const firstName = (local.split(" ")[0] || firstNameFromEmail(user.email)).replace(/^./, (c) => c.toUpperCase());
  return <OnboardingV2 firstName={firstName} />;
}
