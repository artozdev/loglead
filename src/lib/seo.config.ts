// Centralized SEO config — single source of truth for metadata, JSON-LD and
// the sitemap. Canonical host is the primary domain actually served.

export const SITE = {
  name: "LogLead",
  url: "https://www.loglead.io",
  locale: "en_US",
  twitter: "@loglead",
  defaultTitle: "LogLead — Your AI SDR for B2B Prospecting",
  titleTemplate: "%s · LogLead",
  description:
    "Your AI SDR: describe your ideal client and LogLead finds qualified B2B prospects across LinkedIn, Google Maps, Reddit and the web — enriched with email and phone, scored by AI, contacted and followed up automatically. You only handle the hot replies.",
  // Short "entity definition" used for LLM/GEO clarity.
  entity:
    "LogLead is an AI SDR (AI sales development representative) for B2B companies: it finds qualified prospects across LinkedIn, Google Maps, Reddit and the web, enriches their contact details (email and phone), scores them, writes and sends personalized outreach, follows up automatically and surfaces the hot replies.",
  keywords: [
    "AI SDR",
    "AI sales development representative",
    "B2B prospecting",
    "B2B lead generation",
    "find B2B clients",
    "AI prospect finder",
    "lead enrichment",
    "sales automation",
    "AI cold outreach",
    "Google Maps leads",
    "LinkedIn prospecting",
  ],
  org: {
    legalName: "Arthur Lorthois",
    siret: "104 040 456 00014",
    email: "loglead@gmail.com",
    sameAs: [
      "https://www.linkedin.com/company/loglead",
      "https://x.com/loglead",
    ],
  },
} as const;

// Absolute URL helper.
export function abs(path = "/"): string {
  return new URL(path, SITE.url).toString();
}
