import HomeBoard from "@/components/HomeBoard";
import { prospects, searches } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function DashboardPage() {
  const { user, workspace } = await requireProfile();
  const [allProspects, recentSearches] = await Promise.all([
    prospects.listByWorkspace(workspace.id),
    searches.listByWorkspace(workspace.id, 5),
  ]);
  const local = (user.email.split("@")[0] || user.email).replace(/[._-]+/g, " ").trim();
  const firstName = (local.split(" ")[0] || "toi").replace(/^./, (c) => c.toUpperCase());
  return (
    <HomeBoard
      firstName={firstName}
      credits={workspace.credits ?? 0}
      prospects={allProspects}
      searches={recentSearches}
      avatarUrl={user.avatarUrl ?? null}
    />
  );
}
