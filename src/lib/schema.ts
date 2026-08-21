import { SITE, abs } from "./seo.config";

// Schema.org builders (JSON-LD). Keep these factual — they feed both Google
// rich results and LLM/GEO understanding of what LogLead is.

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.org.legalName,
    url: SITE.url,
    logo: abs("/loglead-logo.svg"),
    email: SITE.org.email,
    sameAs: [...SITE.org.sameAs],
    identifier: { "@type": "PropertyValue", propertyID: "SIRET", value: SITE.org.siret },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    alternateName: ["LogLead AI", "LogLead B2B Growth Platform"],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Lead Generation Software",
    operatingSystem: "Web",
    url: SITE.url,
    description: SITE.entity,
    featureList: [
      "LinkedIn Market Intelligence",
      "B2B Lead Discovery and Scoring",
      "AI Content Generation for LinkedIn",
      "AI Visibility Tracking (GEO)",
      "AI Growth Partner",
    ],
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "99",
      priceCurrency: "EUR",
    },
    audience: {
      "@type": "Audience",
      audienceType: "B2B Companies, SaaS Founders, Agencies",
    },
    sameAs: [...SITE.org.sameAs],
  };
}

// Reusable FAQPage builder for feature/comparison/blog pages.
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

// Reusable BreadcrumbList for deep pages.
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}
