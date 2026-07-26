import { redirect } from "next/navigation";
import LogAgentBoard from "@/components/LogAgentBoard";
import { agentMessages } from "@/lib/db";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";
import { AGENT_MONTHLY_QUOTA } from "@/lib/types";

export default async function LogAgentPage() {
  const { user, workspace } = await requireProfile();
  // LogAgent is a Pro-only beta.
  if (!planAllows(workspace.plan, "agent")) redirect("/pricing");

  const local = (user.email.split("@")[0] || user.email).replace(/[._-]+/g, " ").trim();
  const firstName =
    (local.split(" ")[0] || "toi").charAt(0).toUpperCase() + (local.split(" ")[0] || "").slice(1);

  return (
    <LogAgentBoard
      firstName={firstName}
      initialCredits={{
        used: agentMessages.creditsUsedThisMonth(workspace.id),
        quota: AGENT_MONTHLY_QUOTA,
      }}
    />
  );
}
