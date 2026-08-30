import type { Metadata } from "next";
import ForPageLayout from "@/components/ForPageLayout";
import JsonLd from "@/components/JsonLd";
import { FOR_PAGES } from "@/lib/forPages";

const page = FOR_PAGES.founders;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: "/for/founders" },
  openGraph: { title: page.metaTitle, description: page.metaDescription, url: "/for/founders", type: "website" },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "LogLead",
          applicationCategory: "BusinessApplication",
          audience: { "@type": "Audience", audienceType: page.audience },
          description: page.metaDescription,
        }}
      />
      <ForPageLayout page={page} />
    </>
  );
}
