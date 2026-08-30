import type { MetadataRoute } from "next";
import { ALTERNATIVE_SLUGS, VS_SLUGS } from "@/lib/competitors";
import { abs } from "@/lib/seo.config";
import { VERTICAL_SLUGS } from "@/lib/verticals";

// Dynamic sitemap — regenerated on every build. Add feature/for/blog routes
// here as they ship (or map them from a config / MDX source).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: {
    path: string;
    priority: number;
    changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1.0, changeFreq: "weekly" },
    { path: "/pricing", priority: 0.9, changeFreq: "weekly" },
    { path: "/affiliate", priority: 0.6, changeFreq: "monthly" },
    { path: "/terms", priority: 0.3, changeFreq: "yearly" },
    { path: "/privacy", priority: 0.3, changeFreq: "yearly" },
    // Comparison pages (high commercial intent).
    ...VS_SLUGS.map((s) => ({ path: `/vs/loglead-vs-${s}`, priority: 0.8, changeFreq: "monthly" as const })),
    ...ALTERNATIVE_SLUGS.map((s) => ({ path: `/alternative/${s}-alternative`, priority: 0.8, changeFreq: "monthly" as const })),
    // Vertical solution pages.
    ...VERTICAL_SLUGS.map((s) => ({ path: `/for/${s}`, priority: 0.8, changeFreq: "monthly" as const })),
    // Dedicated audience pages (agencies already covered by VERTICAL_SLUGS).
    ...["sales", "freelancers", "founders"].map((s) => ({ path: `/for/${s}`, priority: 0.8, changeFreq: "monthly" as const })),
  ];

  return routes.map((r) => ({
    url: abs(r.path),
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
