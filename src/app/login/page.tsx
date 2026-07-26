import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

const NOTICES: Record<string, string> = {
  password_updated: "Mot de passe mis à jour — connecte-toi avec le nouveau.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { message } = await searchParams;
  return <AuthForm mode="login" notice={message ? NOTICES[message] : undefined} />;
}
