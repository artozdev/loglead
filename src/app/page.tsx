import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { getCurrentUser } from "@/lib/auth";

const TITLE = "LogLead — Le système de croissance IA pour les entreprises B2B";
const DESC =
  "LogLead transforme LinkedIn en moteur d'acquisition. Identifiez vos meilleurs prospects, détectez leurs signaux d'intérêt et créez le contenu qui les attire.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: "https://loglead.io" },
  openGraph: { title: TITLE, description: DESC, url: "https://loglead.io", siteName: "LogLead", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

// SoftwareApplication + Organization structured data for SEO.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LogLead",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: DESC,
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  publisher: { "@type": "Organization", name: "LogLead", url: "https://loglead.io" },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <LandingPage />
    </>
  );
}
