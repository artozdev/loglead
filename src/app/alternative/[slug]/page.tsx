import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComparisonPage from "@/components/seo/ComparisonPage";
import { ALTERNATIVE_SLUGS, getCompetitor } from "@/lib/competitors";

export const dynamicParams = false; // only the known slugs exist

export function generateStaticParams() {
  return ALTERNATIVE_SLUGS.map((slug) => ({ slug: `${slug}-alternative` }));
}

function fromParam(param: string) {
  const m = param.match(/^(.+)-alternative$/);
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
  const title = `The Best ${c.name} Alternative for B2B Growth (2026)`;
  const description = `Looking for a ${c.name} alternative? See how LogLead compares for LinkedIn lead generation, content and AI visibility — and why B2B teams switch.`;
  return {
    title,
    description,
    alternates: { canonical: `/alternative/${slug}` },
    openGraph: { title, description, url: `/alternative/${slug}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = fromParam(slug);
  if (!c || !c.hasAlternative) notFound();
  return <ComparisonPage c={c} mode="alternative" />;
}
