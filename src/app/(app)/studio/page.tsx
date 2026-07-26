import { redirect } from "next/navigation";

// /studio has moved to /post-generator. Redirect, preserving query params so
// every existing deep-link (?content, ?brief, ?topic, ?tab…) keeps working.
export default async function StudioRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v) && v[0]) qs.set(k, v[0]);
  }
  const q = qs.toString();
  redirect(`/post-generator${q ? `?${q}` : ""}`);
}
