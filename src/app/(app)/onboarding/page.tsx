import OnboardingWizard, {
  type WizardData,
} from "@/components/OnboardingWizard";
import { onboardingProgress } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";

export default async function OnboardingPage() {
  const { workspace } = await requireWorkspace();
  const progress = onboardingProgress.get(workspace.id);

  return (
    <OnboardingWizard
      initialStep={progress?.step ?? 1}
      initialData={(progress?.data ?? {}) as WizardData}
    />
  );
}
