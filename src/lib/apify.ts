import "server-only";
import type { ProspectSource, SearchCriteria } from "./types";

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
// Defaults target HarvestAPI actors (no LinkedIn cookie required).
const PROFILE_ACTOR =
  process.env.APIFY_LINKEDIN_PROFILE_ACTOR || "harvestapi~linkedin-profile-scraper";
const POSTS_ACTOR =
  process.env.APIFY_LINKEDIN_POSTS_ACTOR || "harvestapi~linkedin-profile-posts";

// HarvestAPI profile scraper mode. The "+ email search" variant also returns a
// verified email (pricier). Override via env if you switch actor/mode.
const PROFILE_MODE =
  process.env.APIFY_LINKEDIN_PROFILE_MODE || "Profile details + email search ($10 per 1k)";

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
  email?: string;
};

// First non-"invalid" email from HarvestAPI's `emails` array.
function pickEmail(o: Record<string, unknown>): string | undefined {
  const arr = o.emails;
  if (!Array.isArray(arr)) return undefined;
  for (const e of arr) {
    if (e && typeof e === "object") {
      const em = e as Record<string, unknown>;
      const addr = typeof em.email === "string" ? em.email.trim() : "";
      if (addr && em.status !== "invalid") return addr;
    } else if (typeof e === "string" && e.trim()) {
      return e.trim();
    }
  }
  return undefined;
}

// Enrich a prospect from their public LinkedIn profile URL (HarvestAPI shape,
// with defensive fallbacks for other actors). Fails soft → null.
export async function enrichLinkedInProfile(
  linkedinUrl: string,
): Promise<LinkedInProfile | null> {
  const items = await runActor(PROFILE_ACTOR, {
    urls: [linkedinUrl],
    profileScraperMode: PROFILE_MODE,
  });
  const item = items?.[0];
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;

  // Current role → HarvestAPI's currentPosition[0], else experience[0], else flat keys.
  const currentPos =
    (o.currentPosition as Record<string, unknown>[] | undefined)?.[0] ??
    (o.experience as Record<string, unknown>[] | undefined)?.[0] ??
    undefined;

  // Location can be a string or { linkedinText }.
  let location = pick(o, ["location", "locationName", "geoLocationName"]);
  if (!location && o.location && typeof o.location === "object") {
    location = pick(o.location as Record<string, unknown>, ["linkedinText", "text"]);
  }

  return {
    jobTitle:
      (currentPos ? pick(currentPos, ["position", "title"]) : undefined) ??
      pick(o, ["jobTitle", "occupation", "headline"]),
    company:
      pick(o, ["companyName", "company", "currentCompany"]) ??
      (currentPos ? pick(currentPos, ["companyName", "title"]) : undefined),
    sector: pick(o, ["industry", "industryName"]),
    location,
    headline: pick(o, ["headline", "summary", "about"]),
    email: pickEmail(o),
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

// ----- Market post search (keyword-based, no cookie) -----------------------
const SEARCH_ACTOR =
  process.env.APIFY_LINKEDIN_SEARCH_ACTOR || "harvestapi~linkedin-post-search";

export type MarketPost = {
  content: string;
  author?: string;
  authorHeadline?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  url?: string;
  postedAt?: string;
};

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

// ----- Engagement → leads (people who reacted / commented on my posts) ------
export type Engager = {
  name: string;
  firstName: string;
  lastName: string;
  headline?: string;
  linkedinUrl?: string;
  kind: "reaction" | "comment";
};

// Scrape the given profile's recent posts and return everyone who reacted or
// commented on them (deduped by profile). Warm leads. Fails soft → [].
export async function scrapeMyEngagers(
  profileUrl: string,
  opts: { maxPosts?: number; maxReactions?: number; maxComments?: number } = {},
): Promise<Engager[]> {
  if (!profileUrl.trim()) return [];
  // Caps are deliberately tight: cost is PAY_PER_EVENT (per post + per reaction
  // + per comment scraped), so worst-case events = posts × (reactions+comments).
  // 5 × (12 + 6) + 5 ≈ 95 events — kept well under the credits charged per run.
  const items = await runActor(
    SEARCH_ACTOR,
    {
      authorUrls: [profileUrl.trim()],
      maxPosts: opts.maxPosts ?? 5,
      scrapeReactions: true,
      maxReactions: opts.maxReactions ?? 10,
      reactionsProfileScraperMode: "short",
      scrapeComments: true,
      maxComments: opts.maxComments ?? 5,
      commentsProfileScraperMode: "short",
    },
    180000,
  );
  if (!items) return [];

  const byUrl = new Map<string, Engager>();
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const isReaction = typeof o.reactionType === "string";
    const isComment = o.commentary != null;
    if (!isReaction && !isComment) continue; // skip the post objects themselves
    const actor = o.actor as Record<string, unknown> | undefined;
    if (!actor) continue;
    const name = pick(actor, ["name"]) ?? "";
    if (!name) continue;
    const url = pick(actor, ["linkedinUrl"]);
    const parts = name.split(/\s+/);
    const engager: Engager = {
      name,
      firstName: parts[0] ?? name,
      lastName: parts.slice(1).join(" "),
      headline: pick(actor, ["info", "position", "headline"]),
      linkedinUrl: url,
      kind: isComment ? "comment" : "reaction",
    };
    // Dedupe by profile URL (fallback: name). A comment outweighs a like.
    const key = url ?? name.toLowerCase();
    const existing = byUrl.get(key);
    if (!existing || (existing.kind === "reaction" && engager.kind === "comment")) {
      byUrl.set(key, engager);
    }
  }
  return [...byUrl.values()];
}

// Search recent LinkedIn posts by keyword (HarvestAPI post search). Returns
// normalized posts (content + engagement). Fails soft → [].
export async function searchLinkedInPosts(
  queries: string[],
  opts: { maxPosts?: number; postedLimit?: string } = {},
): Promise<MarketPost[]> {
  const q = queries.map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (!q.length) return [];
  const items = await runActor(
    SEARCH_ACTOR,
    {
      searchQueries: q,
      maxPosts: opts.maxPosts ?? 25,
      postedLimit: opts.postedLimit ?? "month",
      sortBy: "relevance",
    },
    120000,
  );
  if (!items) return [];
  return items
    .map((it): MarketPost | null => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const content = typeof o.content === "string" ? o.content.trim() : "";
      if (!content) return null;
      const author = (o.author as Record<string, unknown> | undefined) ?? undefined;
      const eng = (o.engagement as Record<string, unknown> | undefined) ?? undefined;
      const posted = (o.postedAt as Record<string, unknown> | undefined) ?? undefined;
      return {
        content,
        author: author ? pick(author, ["name"]) : undefined,
        authorHeadline: author ? pick(author, ["info", "headline"]) : undefined,
        likes: num(eng?.likes),
        comments: num(eng?.comments),
        shares: num(eng?.shares),
        url: pick(o, ["linkedinUrl", "shareLinkedinUrl"]),
        postedAt: posted ? pick(posted, ["date"]) : undefined,
      };
    })
    .filter((p): p is MarketPost => p !== null);
}

// ----- LogAgent: prospect sources (Google Maps, LinkedIn Jobs) -------------
const GMAPS_ACTOR = process.env.APIFY_GMAPS_ACTOR || "compass~crawler-google-places";
const LINKEDIN_JOBS_ACTOR = process.env.APIFY_LINKEDIN_JOBS_ACTOR || "bebity~linkedin-jobs-scraper";

// Normalized candidate before scoring/persisting.
export type RawProspect = {
  companyName: string;
  companyDomain?: string;
  companyLocation?: string;
  companySector?: string;
  contactName?: string;
  contactLinkedinUrl?: string;
  website?: string;
  phone?: string;
  rating?: number;
  source: ProspectSource;
  signalType?: string;
  signalDescription?: string;
  signalDate?: string;
};

function domainFrom(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

// Google Maps — local businesses (restaurants, SMBs…). No cookie.
export async function searchGooglePlaces(criteria: SearchCriteria, max = 15): Promise<RawProspect[]> {
  const terms = [criteria.sector, ...(criteria.keywords ?? [])].filter(Boolean).join(" ") || "business";
  const items = await runActor(
    GMAPS_ACTOR,
    {
      searchStringsArray: [terms],
      locationQuery: criteria.location || undefined,
      maxCrawledPlacesPerSearch: Math.min(30, max * 2),
      language: "fr",
      website: criteria.signal === "no_website" ? "withoutWebsite" : "allPlaces",
    },
    180000,
  );
  if (!items) return [];
  const wantLowRating = criteria.signal === "low_rating";
  return items
    .map((it): RawProspect | null => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const name = pick(o, ["title", "name"]);
      if (!name) return null;
      const rating = typeof o.totalScore === "number" ? o.totalScore : undefined;
      const website = pick(o, ["website"]);
      return {
        companyName: name,
        website,
        companyDomain: domainFrom(website),
        phone: pick(o, ["phone", "phoneUnformatted"]),
        companyLocation: pick(o, ["city", "address"]),
        companySector: pick(o, ["categoryName"]),
        rating,
        source: "google_maps",
        signalType: website ? "google_maps" : "no_website",
        signalDescription: !website
          ? "Sans site web"
          : rating != null
            ? `Note ${rating.toFixed(1)}★`
            : "Google Maps",
      };
    })
    .filter((p): p is RawProspect => p !== null)
    .filter((p) => (wantLowRating ? (p.rating ?? 5) < 4 : true))
    .slice(0, max);
}

// LinkedIn Jobs — companies actively hiring (a strong buying signal).
export async function searchLinkedInJobs(criteria: SearchCriteria, max = 15): Promise<RawProspect[]> {
  const items = await runActor(
    LINKEDIN_JOBS_ACTOR,
    {
      title: criteria.jobTitle || criteria.sector || "",
      location: criteria.location || "France",
      rows: Math.min(25, max * 2),
      proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    },
    180000,
  );
  if (!items) return [];
  const seen = new Set<string>();
  const out: RawProspect[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const company = pick(o, ["companyName", "company"]);
    if (!company || seen.has(company.toLowerCase())) continue;
    seen.add(company.toLowerCase());
    const jobTitle = pick(o, ["title", "jobTitle"]);
    out.push({
      companyName: company,
      companyLocation: pick(o, ["location"]),
      contactLinkedinUrl: pick(o, ["companyLinkedinUrl", "companyUrl"]),
      source: "linkedin_jobs",
      signalType: "job_posting",
      signalDescription: jobTitle ? `Recrute : ${jobTitle}` : "Recrutement en cours",
      signalDate: pick(o, ["publishedAt", "postedAt"]),
    });
    if (out.length >= max) break;
  }
  return out;
}

// ----- Social discovery sources (Instagram, TikTok, Facebook, X) -----------
// Experimental V1.2 sources: search by keyword → profiles as prospects.
const SOCIAL_ACTORS: Record<string, string> = {
  instagram: process.env.APIFY_INSTAGRAM_ACTOR || "apify~instagram-scraper",
  tiktok: process.env.APIFY_TIKTOK_ACTOR || "clockworks~tiktok-scraper",
  facebook: process.env.APIFY_FACEBOOK_ACTOR || "apify~facebook-search-scraper",
  twitter: process.env.APIFY_TWITTER_ACTOR || "apidojo~twitter-user-scraper",
};

function nested(o: Record<string, unknown>, path: string): Record<string, unknown> | undefined {
  const v = o[path];
  return v && typeof v === "object" ? (v as Record<string, unknown>) : undefined;
}

export async function searchSocial(
  source: "instagram" | "tiktok" | "facebook" | "twitter",
  criteria: SearchCriteria,
  max = 15,
): Promise<RawProspect[]> {
  const term =
    [criteria.sector, criteria.jobTitle, ...(criteria.keywords ?? [])].filter(Boolean).join(" ") ||
    criteria.location ||
    "business";
  const actor = SOCIAL_ACTORS[source];

  const input: Record<string, unknown> =
    source === "instagram"
      ? { search: term, searchType: "user", searchLimit: max, resultsType: "details" }
      : source === "tiktok"
        ? { hashtags: [term.replace(/\s+/g, "")], resultsPerPage: max, profileScrapeSections: ["videos"] }
        : source === "twitter"
          ? { searchTerms: [term], maxItems: max, getAbout: true }
          : { searchQueries: [term], maxResults: max }; // facebook

  const items = await runActor(actor, input, 180000);
  if (!items) return [];

  const seen = new Set<string>();
  const out: RawProspect[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    let name: string | undefined;
    let handle: string | undefined;
    let url: string | undefined;
    let followers: number | undefined;
    let website: string | undefined;

    if (source === "instagram") {
      name = pick(o, ["fullName", "username", "name"]);
      handle = pick(o, ["username"]);
      website = pick(o, ["externalUrl"]);
      url = pick(o, ["url"]) ?? (handle ? `https://instagram.com/${handle}` : undefined);
      followers = typeof o.followersCount === "number" ? o.followersCount : undefined;
    } else if (source === "tiktok") {
      const a = nested(o, "authorMeta");
      name = a ? pick(a, ["nickName", "name"]) : pick(o, ["name"]);
      handle = a ? pick(a, ["name"]) : undefined;
      url = handle ? `https://tiktok.com/@${handle}` : undefined;
      followers = a && typeof a.fans === "number" ? a.fans : undefined;
    } else if (source === "twitter") {
      name = pick(o, ["name", "fullName"]);
      handle = pick(o, ["userName", "screen_name", "username"]);
      url = pick(o, ["url"]) ?? (handle ? `https://x.com/${handle}` : undefined);
      followers = typeof o.followers === "number" ? o.followers : undefined;
    } else {
      // facebook
      name = pick(o, ["title", "name", "pageName"]);
      url = pick(o, ["url", "pageUrl", "facebookUrl"]);
      website = pick(o, ["website"]);
      followers = typeof o.likes === "number" ? o.likes : undefined;
    }

    if (!name) continue;
    const key = (handle ?? name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      companyName: name,
      companyDomain: domainFrom(website),
      website,
      contactLinkedinUrl: url,
      source,
      signalType: source,
      signalDescription: followers != null ? `${followers.toLocaleString("fr-FR")} abonnés ${source === "twitter" ? "X" : source}` : `Profil ${source}`,
    });
    if (out.length >= max) break;
  }
  return out;
}
