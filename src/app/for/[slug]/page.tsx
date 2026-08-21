import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VerticalPage from "@/components/seo/VerticalPage";
import { getVertical, VERTICAL_SLUGS } from "@/lib/verticals";

export const dynamicParams = false;

export function generateStaticParams() {
  return VERTICAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = getVertical(slug);
  if (!v) return {};
  const title = v.h1.en;
  const description = v.intro.en;
  return {
    title,
    description,
    keywords: [v.keyword],
    alternates: { canonical: `/for/${slug}` },
    openGraph: { title, description, url: `/for/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getVertical(slug);
  if (!v) notFound();
  return <VerticalPage v={v} />;
}
