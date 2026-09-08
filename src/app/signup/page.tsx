import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { profiles } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    // Already logged in → resume where they left off. Finished onboarding goes to
    // the app; anyone who didn't reach the end is routed back into onboarding
    // (which itself forwards to the plan step if their profile already exists).
    const ws = await getActiveWorkspace(user);
    const profile = ws ? await profiles.findByWorkspace(ws.id) : null;
    const onboarded = Boolean(profile) && Boolean(ws?.planChosen);
    redirect(onboarded ? "/dashboard" : "/onboarding");
  }
  return <AuthForm mode="signup" />;
}
