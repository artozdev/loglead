import AnalyticsComingSoon from "@/components/AnalyticsComingSoon";
import { waitlist } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function AnalyticsPage() {
  const { user } = await requireProfile();
  const alreadySubscribed = await waitlist.isSubscribed("analytics", user.email);
  return <AnalyticsComingSoon email={user.email} alreadySubscribed={alreadySubscribed} />;
}
