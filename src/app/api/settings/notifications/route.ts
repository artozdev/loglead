import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { users } from "@/lib/db";

const schema = z.object({
  dailyBrief: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  newLead: z.boolean().optional(),
});

// PATCH — persist the email-notification toggles (Paramètres > Notifications).
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  users.updateEmailPrefs(user.id, parsed.data);
  return NextResponse.json({ ok: true });
}
