import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn, verifyPassword } from "@/lib/auth";
import { users } from "@/lib/db";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const user = users.findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect." },
      { status: 401 },
    );
  }

  await signIn(user.id);
  return NextResponse.json({ ok: true });
}
