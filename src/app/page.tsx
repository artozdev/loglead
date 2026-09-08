import type { Metadata } from "next";
import { redirect } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LandingV5 from "@/components/LandingV5";
import { getCurrentUser } from "@/lib/auth";
import { profiles } from "@/lib/db";
import { softwareApplicationSchema } from "@/lib/schema";
import { SITE } from "@/lib/seo.config";
import { getActiveWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "LogLead — Your AI Sales Agent for B2B",
  description:
    "LogLead prospects, messages and follows up automatically. You only see the hot conversations. Start your 7-day free trial.",
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
      <LandingV5 />
    </>
  );
}
