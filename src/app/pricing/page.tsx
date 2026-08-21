import type { Metadata } from "next";
import Link from "next/link";
import { LangProvider } from "@/components/lpLang";
import { BTN_P, FAQ, LandingFooter, LandingNavbar, PricingLanding, Roll } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Pricing — Start free with 100 credits",
  description:
    "Choose your LogLead plan — Free, Starter, Growth or Pro. Start free with 100 credits, no credit card required. 1 credit = €0.01.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "LogLead Pricing — Start free with 100 credits",
    description: "Free, Starter, Growth or Pro. Start free with 100 credits, no credit card required.",
    url: "/pricing",
    type: "website",
  },
};

const PRICING_FAQ: [string, string][] = [
  ["What happens if I run out of credits?", "Nothing stops. You get a notification when you're running low. You can buy more credits (500 credits = €5) or upgrade your plan. No surprise cuts."],
  ["What counts as a credit?", "Every AI action costs credits: generating a post (10), finding a prospect (50), enriching an email (20), enriching a full profile (35), asking the AI agent (10). Your credit history shows every transaction in detail."],
  ["Do unused credits expire?", "Monthly credits roll over for one month. Credits you purchase never expire — they stay in your balance indefinitely."],
  ["Can I switch plans anytime?", "Yes. Upgrading takes effect immediately — you're charged the difference for the current period. Downgrading takes effect at the next renewal."],
  ["What happens to my data if I cancel?", "Your data is preserved for 30 days after cancellation. Nothing is deleted automatically. If you come back, everything is exactly as you left it."],
];

export default function PricingPage() {
  return (
    <LangProvider>
    <div className="min-h-screen bg-[#0A0A0A] font-sans antialiased">
      <LandingNavbar />
      <PricingLanding />
      <FAQ items={PRICING_FAQ} badge="FAQ" title="The most asked questions" tone="dark" />
      <section className="lp-dark px-5 py-24 text-center sm:px-6">
        <p className="mx-auto max-w-xl text-[22px] font-bold text-white">Try 7 days on the plan you want — no credit card required.</p>
        <Link href="/signup" className={`${BTN_P} mt-6`}><Roll>→ Start for free</Roll></Link>
        <p className="mt-4 text-[12px] text-[#6A7690]">7-day free trial · No credit card · Cancel anytime</p>
      </section>
      <LandingFooter tone="dark" />
    </div>
    </LangProvider>
  );
}
