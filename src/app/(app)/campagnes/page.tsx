import { redirect } from "next/navigation";
import CampaignsList from "@/components/CampaignsList";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";

export default async function CampagnesPage() {
  const { workspace } = await requireProfile();
  if (!planAllows(workspace.plan, "campaigns")) redirect("/pricing");
  return <CampaignsList />;
}
