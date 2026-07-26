import { createHash } from "crypto";
import Link from "next/link";
import Logo from "@/components/Logo";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { passwordResets } from "@/lib/db";

// /reset-password?token=… — the token is validated server-side before the
// form renders; expired/invalid links get the error state straight away.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = token
    ? Boolean(passwordResets.findValid(createHash("sha256").update(token).digest("hex")))
    : false;

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size={48} />
          </div>
          <div className="card text-center">
            <p className="font-display text-base font-semibold text-ink">
              ❌ Ce lien a expiré
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Les liens de réinitialisation sont valables 1 heure.
            </p>
            <Link href="/forgot-password" className="btn-primary mt-5 inline-flex">
              Demander un nouveau lien →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token!} />;
}
