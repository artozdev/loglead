import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { users } from "@/lib/db";

const schema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Nouveau mot de passe : 8 caractères minimum"),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect." },
      { status: 400 },
    );
  }

  await users.updatePassword(user.id, hashPassword(parsed.data.newPassword));
  return NextResponse.json({ ok: true });
}
