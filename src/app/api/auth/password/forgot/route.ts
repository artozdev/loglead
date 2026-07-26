import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import ResetPasswordEmail from "../../../../../../emails/reset-password";
import { passwordResets, users } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/emails/send";
import { rateLimit } from "@/lib/ratelimit";

const schema = z.object({ email: z.string().email("Email invalide") });

// Always answers {ok:true}: never reveal whether an email exists (anti
// user-enumeration). The reset link is emailed only when the account exists.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  if (!rateLimit(`forgot:${email}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessaie dans quelques minutes." },
      { status: 429 },
    );
  }

  const user = await users.findByEmail(email);
  if (user) {
    // Only the SHA-256 hash is persisted; the raw token lives in the email link.
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await passwordResets.create(user.id, tokenHash);
    await sendEmail({
      to: user.email,
      subject: "Réinitialise ton mot de passe LogLead",
      template: ResetPasswordEmail({
        resetUrl: `${appUrl()}/reset-password?token=${token}`,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
