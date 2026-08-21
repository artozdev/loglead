import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo.config";

// Dynamic sitemap — regenerated on every build. Add feature/vs/for/blog routes
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
  ];

  return routes.map((r) => ({
    url: abs(r.path),
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
