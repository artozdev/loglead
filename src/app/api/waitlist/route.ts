import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { waitlist } from "@/lib/db";

const schema = z.object({
  feature: z.string().min(1).max(120),
  email: z.string().email(),
});

// Is the current user already on a feature's waitlist? (?feature=leads)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const feature = new URL(req.url).searchParams.get("feature") ?? "";
  return NextResponse.json({ subscribed: await waitlist.isSubscribed(feature, user.email) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { already } = await waitlist.add(parsed.data.feature, parsed.data.email, user.id);
  return NextResponse.json({ ok: true, already });
}
