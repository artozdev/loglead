import { notFound, redirect } from "next/navigation";
import LeadDetail from "@/components/LeadDetail";
import { contentItems, leads } from "@/lib/db";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { workspace } = await requireProfile();
  // Leads is a Growth/Pro module.
  if (!planAllows(workspace.plan, "leads")) {
    redirect("/pricing");
  }
  const { id } = await params;
  const lead = await leads.findById(id, workspace.id);
  if (!lead) notFound();

  const contents = (await contentItems.listByWorkspace(workspace.id)).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <LeadDetail leadId={id} isPro={workspace.plan === "pro"} contents={contents} />
  );
}
