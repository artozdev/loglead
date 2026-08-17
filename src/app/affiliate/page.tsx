import type { Metadata } from "next";
import Link from "next/link";
import { LangProvider } from "@/components/lpLang";
import { AffiliateSection, BTN_P, FAQ, LandingFooter, LandingNavbar, Roll } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Affiliate Program — Earn 40% recurring commission · LogLead",
  description:
    "Share LogLead and earn 40% of every referral's subscription, every month, for life. A recurring commission with no limit.",
};

const AFFILIATE_FAQ: [string, string][] = [
  ["How does the 40% commission work?", "You earn 40% of every monthly subscription paid by people you refer, for as long as they remain active customers. If they upgrade, your commission increases automatically with their plan."],
  ["When and how do I get paid?", "Commissions are paid once you reach €50 in cumulative earnings. Payments are processed monthly via Stripe or PayPal, within the first 5 days of each month."],
  ["Do I need to apply?", "Yes — manual validation within a few days. This keeps the program clean and prevents abuse."],
  ["Does payment stop if my referral cancels?", "Yes, from the month of cancellation. Past months already paid are always yours."],
  ["Is there a limit to how much I can earn?", "No limit. The more people you refer, the more you earn — every month, indefinitely."],
];

export default function AffiliatePage() {
  return (
    <LangProvider>
    <div className="min-h-screen bg-[#0A0A0A] font-sans antialiased">
      <LandingNavbar />
      <AffiliateSection tone="dark" />
      <FAQ items={AFFILIATE_FAQ} badge="FAQ" title="The most asked questions" tone="dark" />
      <section className="lp-dark px-5 py-24 text-center sm:px-6">
        <p className="mx-auto max-w-xl text-[24px] font-bold text-white">Join the LogLead affiliate program.</p>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-[#8B9EC4]">Earn 40% of each subscription you generate, every month, for life.</p>
        <Link href="/signup" className={`${BTN_P} mt-6`}><Roll>→ Become an affiliate — It&apos;s free</Roll></Link>
        <p className="mt-4 text-[12px] text-[#6A7690]">Validation in a few days. No technical setup required.</p>
      </section>
      <LandingFooter tone="dark" />
    </div>
    </LangProvider>
  );
}
