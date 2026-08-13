import "server-only";

// ---------------------------------------------------------------------------
// FullEnrich contact enrichment (email + phone waterfall). Async API: we POST
// a single-contact batch, get an enrichment_id, then poll the GET endpoint
// until FINISHED. Same philosophy as the other integrations: returns null on
// any failure / missing key so the caller can fall back gracefully.
// ---------------------------------------------------------------------------

const BASE = "https://app.fullenrich.com/api/v2/contact/enrich/bulk";

export function hasFullEnrich(): boolean {
  return Boolean(process.env.FULLENRICH_API_KEY);
}

export type EnrichInput = {
  firstName: string;
  lastName: string;
  companyName?: string;
  domain?: string;
  linkedinUrl?: string;
};

export type EnrichedContact = {
  workEmail?: string;
  personalEmail?: string;
  phone?: string;
};

type StartResponse = { enrichment_id?: string };
type ResultResponse = {
  status?: string;
  data?: Array<{
    contact_info?: {
      most_probable_work_email?: { email?: string } | null;
      most_probable_personal_email?: { email?: string } | null;
      most_probable_phone?: { number?: string } | null;
    } | null;
  }>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function startEnrichment(
  key: string,
  input: EnrichInput,
): Promise<string | null> {
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `loglead-${input.firstName}-${input.lastName}`.slice(0, 60),
        data: [
          {
            first_name: input.firstName,
            last_name: input.lastName,
            company_name: input.companyName,
            domain: input.domain,
            linkedin_url: input.linkedinUrl,
            enrich_fields: [
              "contact.work_emails",
              "contact.personal_emails",
              "contact.phones",
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as StartResponse;
    return json.enrichment_id ?? null;
  } catch {
    return null;
  }
}

function extract(json: ResultResponse): EnrichedContact {
  const info = json.data?.[0]?.contact_info;
  return {
    workEmail: info?.most_probable_work_email?.email ?? undefined,
    personalEmail: info?.most_probable_personal_email?.email ?? undefined,
    phone: info?.most_probable_phone?.number ?? undefined,
  };
}

// Enrich a single contact. Polls until FINISHED or maxWaitMs elapses. Returns
// null if the key is missing, the request fails, or it's still pending after
// the timeout (the caller keeps the lead as-is rather than faking data).
export async function enrichContact(
  input: EnrichInput,
  { maxWaitMs = 40000, intervalMs = 2500 } = {},
): Promise<EnrichedContact | null> {
  const key = process.env.FULLENRICH_API_KEY;
  if (!key) return null;

  const id = await startEnrichment(key, input);
  if (!id) return null;

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    try {
      const res = await fetch(`${BASE}/${id}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as ResultResponse;
      const status = json.status;
      if (status === "FINISHED") return extract(json);
      if (
        status === "CANCELED" ||
        status === "CREDITS_INSUFFICIENT" ||
        status === "UNKNOWN"
      ) {
        return null;
      }
      // CREATED / IN_PROGRESS / RATE_LIMIT → keep polling.
    } catch {
      /* transient — keep polling until the deadline */
    }
  }
  return null; // still pending after the timeout
}

// "https://www.acme.com/x" → "acme.com"; null if not derivable.
export function domainFromUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "") || undefined;
  } catch {
    return undefined;
  }
}
