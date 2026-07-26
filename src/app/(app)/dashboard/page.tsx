import DashboardHome from "@/components/DashboardHome";
import { buildChecklist } from "@/lib/checklist";
import { requireProfile } from "@/lib/guards";
import { buildHomeData } from "@/lib/home";

export default async function DashboardPage() {
  const { user, workspace, profile } = await requireProfile();
  const data = buildHomeData(workspace.id, workspace.name, user.email, workspace.plan);
  const checklist = buildChecklist(workspace.id, profile);
  return <DashboardHome data={data} checklist={checklist} />;
}
