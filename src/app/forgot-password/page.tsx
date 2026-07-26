import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { getCurrentUser } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  // Pre-fill the email when a session exists (e.g. user wants to rotate it).
  const user = await getCurrentUser();
  return <ForgotPasswordForm initialEmail={user?.email ?? ""} />;
}
