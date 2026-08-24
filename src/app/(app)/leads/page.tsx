import LeadsBoard from "@/components/LeadsBoard";
import { prospects } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function LeadsPage() {
  const { workspace } = await requireProfile();
  const list = await prospects.listByWorkspace(workspace.id);
  return <LeadsBoard prospects={list} />;
}
