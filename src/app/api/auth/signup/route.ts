import { NextResponse } from "next/server";
import { z } from "zod";
import ConfirmEmail from "../../../../../emails/confirm-email";
import { hashPassword, makeToken, signIn } from "@/lib/auth";
import { users, workspaces } from "@/lib/db";
import { appUrl, firstNameFromEmail, sendEmail } from "@/lib/emails/send";
import { setActiveWorkspace } from "@/lib/workspace";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
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

  if (await users.findByEmail(email)) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const user = await users.create(email, hashPassword(password));
  // Bootstrap the founder's first workspace (renamed during onboarding).
  const workspace = await workspaces.create("Ma startup", user.id);
  await signIn(user.id);
  await setActiveWorkspace(workspace.id);

  // Email 1 — address confirmation (non-blocking: the account works either
  // way in the MVP; the link marks the address verified, valid 24h).
  const confirmToken = makeToken(`confirm:${user.id}:${Date.now()}`);
  void sendEmail({
    to: user.email,
    subject: "Confirme ton adresse email — LogLead",
    template: ConfirmEmail({
      firstName: firstNameFromEmail(user.email),
      confirmUrl: `${appUrl()}/api/auth/confirm?token=${encodeURIComponent(confirmToken)}`,
    }),
  });

  return NextResponse.json({ ok: true });
}
