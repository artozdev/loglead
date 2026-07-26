import { redirect } from "next/navigation";
import LeadsHub from "@/components/LeadsHub";
import { contentItems } from "@/lib/db";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";

export default async function LeadsPage() {
  const { workspace } = await requireProfile();
  // Leads is a Growth/Pro module — send everyone else to the pricing page.
  if (!planAllows(workspace.plan, "leads")) {
    redirect("/pricing");
  }
  const contents = (await contentItems.listByWorkspace(workspace.id)).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <LeadsHub
      isPro={workspace.plan === "pro"}
      workspaceId={workspace.id}
      contents={contents}
    />
  );
}
