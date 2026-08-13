import "server-only";

// ---------------------------------------------------------------------------
// Apify — LinkedIn public data (profile enrichment, competitor posts, prospect
// search). Called via the REST run-sync endpoint (no extra dependency).
//
// ⚠️ Scraping LinkedIn breaches LinkedIn's ToS and most actors need a logged-in
// session cookie. Actor IDs are configurable via env so you can point at the
// actor you actually run. Every function fails soft (returns null/[]) so the
// app never crashes when Apify is absent or an actor errors.
// ---------------------------------------------------------------------------

const BASE = "https://api.apify.com/v2";

// Actor ids are env-configurable (REST form uses "~", e.g. "user~actor").
const PROFILE_ACTOR =
  process.env.APIFY_LINKEDIN_PROFILE_ACTOR || "apify~linkedin-profile-scraper";
const POSTS_ACTOR =
  process.env.APIFY_LINKEDIN_POSTS_ACTOR || "apify~linkedin-post-search-scraper";

export function hasApify(): boolean {
  return Boolean(process.env.APIFY_API_TOKEN);
}

// Run an actor synchronously and return its dataset items. Null on any failure.
async function runActor(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 60000,
): Promise<unknown[] | null> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    const items = (await res.json()) as unknown;
    return Array.isArray(items) ? items : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Actor output shapes vary; read the first present key defensively.
function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export type LinkedInProfile = {
  jobTitle?: string;
  company?: string;
  sector?: string;
  location?: string;
  headline?: string;
};

// Enrich a prospect from their public LinkedIn profile URL.
export async function enrichLinkedInProfile(
  linkedinUrl: string,
): Promise<LinkedInProfile | null> {
  const items = await runActor(PROFILE_ACTOR, {
    profileUrls: [linkedinUrl],
    proxy: { useApifyProxy: true },
  });
  const item = items?.[0];
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const company = pick(o, ["companyName", "company", "currentCompany"]);
  const org =
    (o.experience as Record<string, unknown>[] | undefined)?.[0] ?? undefined;
  return {
    jobTitle: pick(o, ["jobTitle", "occupation", "position", "headline"]),
    company: company ?? (org ? pick(org, ["companyName", "title"]) : undefined),
    sector: pick(o, ["industry", "industryName"]),
    location: pick(o, ["location", "locationName", "geoLocationName"]),
    headline: pick(o, ["headline", "summary"]),
  };
}

// Scrape a competitor's recent LinkedIn posts (Market Intelligence).
export async function scrapeCompetitorPosts(
  linkedinUrl: string,
  maxPosts = 20,
): Promise<unknown[]> {
  const items = await runActor(POSTS_ACTOR, {
    profileUrls: [linkedinUrl],
    maxPosts,
  });
  return items ?? [];
}
