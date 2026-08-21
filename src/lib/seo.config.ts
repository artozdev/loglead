// Centralized SEO config — single source of truth for metadata, JSON-LD and
// the sitemap. Canonical host is the primary domain actually served.

export const SITE = {
  name: "LogLead",
  url: "https://www.loglead.io",
  locale: "en_US",
  twitter: "@loglead",
  defaultTitle: "LogLead — The AI Growth Engine for B2B LinkedIn",
  titleTemplate: "%s · LogLead",
  description:
    "Turn LinkedIn into your #1 B2B acquisition channel. Find qualified prospects, generate converting content and track your AI visibility — all in one platform.",
  // Short "entity definition" used for LLM/GEO clarity.
  entity:
    "LogLead is an AI-powered B2B growth platform that helps companies generate qualified leads on LinkedIn through market intelligence, prospect discovery and AI-generated content.",
  keywords: [
    "LinkedIn lead generation",
    "B2B lead generation",
    "LinkedIn prospecting",
    "AI growth engine",
    "B2B growth platform",
    "AI visibility",
    "generative engine optimization",
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
