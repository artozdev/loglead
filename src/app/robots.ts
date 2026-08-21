import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the private app, API and auth flows out of the index.
      disallow: ["/api/", "/auth/", "/dashboard", "/settings", "/onboarding", "/leads", "/market", "/logagent", "/inbox", "/studio", "/post-generator", "/templates", "/geo", "/ia-visibility", "/linkedin-analytics", "/analytics", "/profile", "/login", "/signup", "/reset-password", "/forgot-password"],
    },
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
