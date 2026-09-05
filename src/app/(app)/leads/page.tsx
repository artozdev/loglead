import LeadsBoard from "@/components/LeadsBoard";
import { prospects, searches } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; segment?: string }>;
}) {
  const { workspace } = await requireProfile();
  const [list, searchList, sp] = await Promise.all([
    prospects.listByWorkspace(workspace.id),
    searches.listByWorkspace(workspace.id, 100),
    searchParams,
  ]);
  return <LeadsBoard prospects={list} searches={searchList} openId={sp.p} initialSegment={sp.segment} />;
}
