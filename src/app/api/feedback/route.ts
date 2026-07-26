import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ message: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  // MVP: acknowledge and log. A real backend would persist or forward this.
  console.log(`[feedback] ${user.email}: ${parsed.data.message}`);
  return NextResponse.json({ ok: true });
}
