import type { Metadata } from "next";
import { Footer, Nav } from "@/components/LandingV5";
import { FAQ, PricingLanding } from "@/components/LandingPage";
import { LangProvider } from "@/components/lpLang";

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

export default function PricingPage() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <Nav solid />
        <PricingLanding tone="light" />
        <FAQ badge="FAQ" tone="light" variant="pricing" />
        <Footer showCta={false} />
      </div>
    </LangProvider>
  );
}
