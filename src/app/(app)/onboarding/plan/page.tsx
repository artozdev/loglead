import { redirect } from "next/navigation";
import Stripe from "stripe";
import PlanSelection from "@/components/PlanSelection";
import { profiles, workspaces } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import type { Plan } from "@/lib/types";

// Mandatory plan screen shown right after onboarding. Uses requireWorkspace
// (not requireProfile) so the plan gate can't loop back here.
export default async function OnboardingPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const profile = await profiles.findByWorkspace(workspace.id);
  if (!profile) redirect("/onboarding");
  if (workspace.planChosen) redirect("/dashboard");

  // Returning from Stripe Checkout: confirm the session server-side and activate
  // the subscription. This is a fallback for the webhook — if it isn't received
  // (misconfigured endpoint, delivery delay), the user would otherwise be stuck
  // here forever because planChosen never flips to true.
  const { session_id: sessionId } = await searchParams;
  const secret = process.env.STRIPE_SECRET_KEY;
  let activatedPlan: Plan | null = null;
  if (sessionId && secret) {
    try {
      const stripe = new Stripe(secret);
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        s.status === "complete" &&
        s.metadata?.type === "subscription" &&
        s.metadata?.workspace_id === workspace.id
      ) {
        const plan = s.metadata.plan as Plan;
        const monthly = parseInt(s.metadata.monthly_credits ?? "0", 10);
        await workspaces.activateSubscription(workspace.id, plan, monthly);
        activatedPlan = plan;
      }
    } catch {
      // Ignore: fall through to the plan screen. The webhook may still activate.
    }
  }
  // redirect() throws, so call it outside the try/catch above.
  if (activatedPlan) redirect(`/dashboard?subscribed=${activatedPlan}`);

  return <PlanSelection />;
}
