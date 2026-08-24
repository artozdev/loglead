import LogAgent from "@/components/LogAgent";
import { requireProfile } from "@/lib/guards";

// LogAgent — the product core (search + AI copilot). Available on all plans;
// individual actions cost credits.
export default async function LogAgentPage() {
  await requireProfile();
  return <LogAgent />;
}
