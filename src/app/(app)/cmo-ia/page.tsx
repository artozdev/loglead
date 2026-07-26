import CmoSetup from "@/components/CmoSetup";
import CmoUpsell from "@/components/CmoUpsell";
import CmoWorkspace from "@/components/CmoWorkspace";
import { cmoActions, cmoConfig } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function CmoPage() {
  const { workspace } = await requireProfile();

  if (workspace.plan !== "pro") {
    return <CmoUpsell currentPlan={workspace.plan} />;
  }

  const config = await cmoConfig.get(workspace.id);
  if (!config.activatedAt) {
    return <CmoSetup />;
  }

  return (
    <CmoWorkspace
      initialConfig={config}
      initialActions={await cmoActions.listByWorkspace(workspace.id)}
      workspaceName={workspace.name}
    />
  );
}
