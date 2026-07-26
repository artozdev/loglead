import { cookies } from "next/headers";
import AppShell from "@/components/AppShell";
import type { AppNotification } from "@/components/NotificationsMenu";
import { contentItems, profiles, workspaces as workspacesRepo } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const active = await getActiveWorkspace(user);
  const onboarded = active
    ? Boolean(await profiles.findByWorkspace(active.id))
    : false;

  const store = await cookies();
  const defaultCollapsed = store.get("loglead_sidebar")?.value === "collapsed";

  const plan = active?.plan ?? "starter";

  // Demo notifications, scoped to the active workspace.
  const notifications: AppNotification[] = [];
  if (active) {
    for (const c of (await contentItems.listByWorkspace(active.id)).slice(0, 4)) {
      notifications.push({
        id: c.id,
        title: "Nouveau contenu prêt",
        detail: c.title,
        time: "Récemment",
      });
    }
  }
  notifications.push({
    id: "analytics-sync",
    title: "Synchronisation analytics terminée",
    detail: "Tes statistiques sont à jour.",
    time: "Aujourd'hui",
  });

  const local = (user.email.split("@")[0] || user.email).replace(/[._-]+/g, " ").trim();
  const name =
    local
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || user.email;
  const initials =
    (name.split(" ").map((w) => w[0]).join("").slice(0, 2) || user.email.slice(0, 2)).toUpperCase();
  const avatarLabel = initials;

  const wsList = (await workspacesRepo.listForUser(user.id)).map((w) => ({
    id: w.id,
    name: w.name,
  }));

  return (
    <AppShell
      notifications={notifications}
      avatarLabel={avatarLabel}
      onboarded={onboarded}
      defaultCollapsed={defaultCollapsed}
      plan={plan}
      user={{ name, email: user.email, initials }}
      workspaces={wsList}
      activeWorkspaceId={active?.id ?? ""}
    >
      {children}
    </AppShell>
  );
}
