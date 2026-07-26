import SettingsHub from "@/components/SettingsHub";
import {
  contentAnalyses,
  contentItems,
  profiles,
  workspaces as workspacesRepo,
} from "@/lib/db";
import { requireUser } from "@/lib/guards";
import type { Plan } from "@/lib/types";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Tab validation happens in SettingsHub (single source of truth for tab ids).
  const { tab: initialTab } = await searchParams;
  const user = await requireUser();
  const workspaces = workspacesRepo.listForUser(user.id);
  const active = await getActiveWorkspace(user);
  const profile = active ? profiles.findByWorkspace(active.id) ?? null : null;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inMonth = (iso: string) => iso.slice(0, 7) === thisMonth;

  const content = active ? contentItems.listByWorkspace(active.id) : [];
  const analyses = active ? contentAnalyses.listByWorkspace(active.id) : [];
  const usage = {
    content: content.filter((c) => inMonth(c.createdAt)).length,
    analyses: analyses.filter((a) => inMonth(a.createdAt)).length,
    workspaces: workspaces.length,
  };

  const renewalDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  const local = (user.email.split("@")[0] || user.email).replace(/[._-]+/g, " ").trim();
  const firstName = local.charAt(0).toUpperCase() + local.split(" ")[0].slice(1);

  return (
    <SettingsHub
      email={user.email}
      firstName={firstName}
      activeName={active?.name ?? "—"}
      plan={(active?.plan ?? "starter") as Plan}
      profile={profile}
      usage={usage}
      renewalDate={renewalDate}
      initialTab={initialTab}
      emailPrefs={user.emailPrefs ?? {}}
    />
  );
}
