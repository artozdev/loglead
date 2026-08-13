import "server-only";

// ---------------------------------------------------------------------------
// Firecrawl scrape client — same philosophy as the AI/email layers: when
// FIRECRAWL_API_KEY is set we scrape for real (clean markdown, handles JS-
// rendered pages and anti-bot), otherwise callers fall back to their own raw
// fetch so every flow stays testable without a key.
// ---------------------------------------------------------------------------

const SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";

export function hasFirecrawl(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

type FirecrawlResponse = {
  success?: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string | string[];
      description?: string | string[];
      statusCode?: number;
    };
  };
  error?: string;
};

export type ScrapedPage = {
  markdown: string;
  title?: string;
};

// Scrape a single URL to markdown. Returns null on any failure (no key, HTTP
// error, empty content) so the caller can fall back gracefully.
export async function scrapePage(url: string): Promise<ScrapedPage | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(SCRAPE_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as FirecrawlResponse;
    const markdown = json.data?.markdown?.trim();
    if (!json.success || !markdown || markdown.length < 80) return null;

    const rawTitle = json.data?.metadata?.title;
    const title = Array.isArray(rawTitle) ? rawTitle[0] : rawTitle;

    return { markdown, title };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
