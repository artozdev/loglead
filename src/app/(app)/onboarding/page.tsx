import { redirect } from "next/navigation";
import OnboardingV2 from "@/components/OnboardingV2";
import { profiles } from "@/lib/db";
import { firstNameFromEmail } from "@/lib/emails/send";
import { requireWorkspace } from "@/lib/guards";

export default async function OnboardingPage() {
  const { user, workspace } = await requireWorkspace();
  // Already onboarded → go to the (mandatory) plan gate or the app.
  const profile = await profiles.findByWorkspace(workspace.id);
  if (profile) redirect(workspace.planChosen ? "/dashboard" : "/onboarding/plan");

  const local = (user.email.split("@")[0] || "").replace(/[._-]+/g, " ").trim();
  const firstName = (local.split(" ")[0] || firstNameFromEmail(user.email)).replace(/^./, (c) => c.toUpperCase());
  return <OnboardingV2 firstName={firstName} />;
}
