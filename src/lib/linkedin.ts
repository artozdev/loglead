import "server-only";

// ---------------------------------------------------------------------------
// LinkedIn official OAuth — login + publishing only.
//
// Scopes use OpenID Connect (`openid profile email`, the current replacement
// for the deprecated r_liteprofile/r_emailaddress) plus `w_member_social` to
// publish on the member's behalf. NOTE: impressions/follower analytics and DMs
// require LinkedIn partner approval (Community Management API) and are NOT
// available here — we deliberately don't pretend to fetch them.
// ---------------------------------------------------------------------------

const AUTHORIZE = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO = "https://api.linkedin.com/v2/userinfo";
const UGC_POSTS = "https://api.linkedin.com/v2/ugcPosts";

const SCOPES = "openid profile email w_member_social";

export function hasLinkedInOAuth(): boolean {
  return Boolean(
    process.env.LINKEDIN_CLIENT_ID &&
      process.env.LINKEDIN_CLIENT_SECRET &&
      process.env.LINKEDIN_REDIRECT_URI,
  );
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE}?${params}`;
}

export type LinkedInToken = { accessToken: string; expiresIn: number };

export async function exchangeCode(code: string): Promise<LinkedInToken | null> {
  try {
    const res = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) return null;
    return { accessToken: json.access_token, expiresIn: json.expires_in ?? 0 };
  } catch {
    return null;
  }
}

export type LinkedInIdentity = { sub: string; name?: string; email?: string };

// OpenID userinfo → member id (`sub`, used as the author URN), name, email.
export async function fetchIdentity(
  accessToken: string,
): Promise<LinkedInIdentity | null> {
  try {
    const res = await fetch(USERINFO, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      sub?: string;
      name?: string;
      email?: string;
    };
    if (!json.sub) return null;
    return { sub: json.sub, name: json.name, email: json.email };
  } catch {
    return null;
  }
}

// Publish a text post on the connected member's profile.
export async function publishPost(
  accessToken: string,
  memberSub: string,
  text: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(UGC_POSTS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${memberSub}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `LinkedIn API ${res.status}` };
    }
    const id = res.headers.get("x-restli-id") ?? undefined;
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
