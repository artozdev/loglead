import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { passwordResets, users } from "@/lib/db";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const reset = await passwordResets.findValid(tokenHash);
  if (!reset || !await users.findById(reset.userId)) {
    return NextResponse.json(
      { error: "Ce lien a expiré ou n'est plus valide.", expired: true },
      { status: 400 },
    );
  }

  await users.updatePassword(reset.userId, hashPassword(parsed.data.password));
  await passwordResets.markUsed(reset.id);
  return NextResponse.json({ ok: true });
}
