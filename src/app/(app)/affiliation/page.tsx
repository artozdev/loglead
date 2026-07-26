import AffiliationView from "@/components/AffiliationView";
import { requireProfile } from "@/lib/guards";

export default async function AffiliationPage() {
  const { user } = await requireProfile();
  // Deterministic referral code from the user id.
  const code = user.id.replace(/-/g, "").slice(0, 8);
  const referralLink = `https://loglead.io/?ref=${code}`;
  return <AffiliationView referralLink={referralLink} />;
}
