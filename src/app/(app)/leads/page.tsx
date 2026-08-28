import LeadsBoard from "@/components/LeadsBoard";
import { prospects } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { workspace } = await requireProfile();
  const [list, sp] = await Promise.all([prospects.listByWorkspace(workspace.id), searchParams]);
  return <LeadsBoard prospects={list} openId={sp.p} />;
}
