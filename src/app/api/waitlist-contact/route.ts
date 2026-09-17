import { NextResponse } from "next/server";
import { z } from "zod";
import { waitlist } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

// Public waitlist for the upcoming "Contact" feature — no auth (landing visitors).
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  const { already } = await waitlist.add("contact", parsed.data.email, "landing");
  return NextResponse.json({ ok: true, already });
}
