import LogAgent from "@/components/LogAgent";
import { requireProfile } from "@/lib/guards";

// LogAgent — the product core (search + AI copilot). Available on all plans;
// individual actions cost credits.
export default async function LogAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireProfile();
  const { q } = await searchParams;
  return <LogAgent initialQuery={q ?? ""} />;
}
