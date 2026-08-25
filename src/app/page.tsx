import type { Metadata } from "next";
import { redirect } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import LandingV5 from "@/components/LandingV5";
import { getCurrentUser } from "@/lib/auth";
import { softwareApplicationSchema } from "@/lib/schema";
import { SITE } from "@/lib/seo.config";

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
  // Logged-in users go to the app — unless ?preview is passed, so the landing
  // stays reviewable without logging out.
  if (user && sp.preview === undefined) redirect("/dashboard");
  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />
      <LandingV5 />
    </>
  );
}
