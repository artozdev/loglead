import type { Metadata } from "next";
import { redirect } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LandingV5 from "@/components/LandingV5";
import { getCurrentUser } from "@/lib/auth";
import { profiles } from "@/lib/db";
import { faqSchema, softwareApplicationSchema } from "@/lib/schema";
import { SITE } from "@/lib/seo.config";

// FAQ content (English) mirrored for the FAQPage JSON-LD (Google rich results).
const FAQ_ITEMS = [
  { q: "What is LogLead exactly?", a: "LogLead is your AI SDR — a prospecting agent that works autonomously so you don't have to. Describe your ideal client in plain language. LogLead searches across the web, qualifies every prospect, enriches their contact data and sends personalized outreach on your behalf. You only see the conversations worth your time. You focus on closing. LogLead handles everything before that." },
  { q: "Where does LogLead search to find prospects?", a: "LogLead searches everywhere your future clients are — Google, Google Maps, LinkedIn, Reddit, Instagram, TikTok, Facebook, X and dozens of other web sources. Whether you're looking for local businesses, B2B companies, e-commerce brands or professionals — if they have a digital footprint, LogLead finds them. No manual search. No copy-pasting. One description, every relevant source scanned simultaneously." },
  { q: "What's the difference between LogLead, Apollo and Clay?", a: "Apollo is a contact database — you search from a fixed list of pre-existing profiles. Clay is a powerful but highly technical enrichment tool that requires significant setup and expertise. LogLead is fundamentally different: you describe your ideal client in plain language and the AI searches 10+ live sources in real time — including Google Maps, Reddit, Instagram and TikTok that Apollo and Clay don't cover. It also finds the clients of your competitors and searches locally — restaurants, agencies, SMBs in any city. No learning curve. No technical setup. Results in under 2 minutes." },
  { q: "How quickly will I see results?", a: "Your first qualified prospects appear in under 2 minutes. LogLead runs all sources simultaneously — no waiting between searches. Most users find their first relevant prospects within minutes of signing up. The AI then enriches each profile with email, phone and company data automatically." },
  { q: "Do I need technical skills to use LogLead?", a: "None. LogLead is designed for founders, sales teams and agencies — not developers. You describe who you're looking for in plain language, just like you'd explain it to a colleague. No filters to configure. No spreadsheets to manage. No API to set up. If you can type a sentence, you can use LogLead." },
  { q: "Can I cancel anytime?", a: "Yes — no commitment, no fine print. Cancel in one click from Settings → Subscription. Your subscription ends at the close of the current billing period and your data stays accessible for 30 days after that." },
];
import { getActiveWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "LogLead — Your AI SDR for B2B",
  description:
    "Describe your ideal client — LogLead finds qualified prospects across LinkedIn, Google Maps, Reddit and the web, enriches their email and phone, messages them and follows up. You only handle the hot replies.",
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE.defaultTitle,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE.defaultTitle, description: SITE.description },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  // Only users who FINISHED onboarding (profile + a chosen plan) are sent to the
  // app. Users who left mid-onboarding stay on the landing when they come back —
  // they resume via the "Commencer" button (which routes them to /onboarding).
  // ?preview keeps the landing reviewable without logging out.
  if (user && sp.preview === undefined) {
    const ws = await getActiveWorkspace(user);
    const profile = ws ? await profiles.findByWorkspace(ws.id) : null;
    const onboarded = Boolean(profile) && Boolean(ws?.planChosen);
    if (onboarded) redirect("/dashboard");
    // else: onboarding not finished → show the landing page.
  }
  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqSchema(FAQ_ITEMS)} />
      <LandingV5 />
    </>
  );
}
