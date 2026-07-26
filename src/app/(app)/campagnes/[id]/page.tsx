import { notFound, redirect } from "next/navigation";
import CampaignDetail from "@/components/CampaignDetail";
import { campaignLeads } from "@/lib/campaign";
import { campaigns } from "@/lib/db";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { workspace } = await requireProfile();
  if (!planAllows(workspace.plan, "campaigns")) redirect("/pricing");
  const { id } = await params;
  const campaign = campaigns.findById(id, workspace.id);
  if (!campaign) notFound();
  const rollup = campaignLeads(workspace.id, campaign);
  return <CampaignDetail campaign={campaign} rollup={rollup} />;
}
