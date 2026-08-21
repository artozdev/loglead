import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComparisonPage from "@/components/seo/ComparisonPage";
import { getCompetitor, VS_SLUGS } from "@/lib/competitors";

export const dynamicParams = false; // only the known slugs exist

export function generateStaticParams() {
  return VS_SLUGS.map((slug) => ({ slug: `loglead-vs-${slug}` }));
}

function fromParam(param: string) {
  const m = param.match(/^loglead-vs-(.+)$/);
  return m ? getCompetitor(m[1]) : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = fromParam(slug);
  if (!c) return {};
  const title = `LogLead vs ${c.name} — Honest Comparison`;
  const description = `LogLead vs ${c.name}: compare approach, features and pricing for B2B lead generation on LinkedIn. See which tool fits your growth motion.`;
  return {
    title,
    description,
    alternates: { canonical: `/vs/${slug}` },
    openGraph: { title, description, url: `/vs/${slug}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = fromParam(slug);
  if (!c || !c.hasVs) notFound();
  return <ComparisonPage c={c} mode="vs" />;
}
