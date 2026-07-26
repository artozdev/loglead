"use client";

import Link from "next/link";
import { useState } from "react";
import type { Plan } from "@/lib/types";
import DarkModeToggle from "./DarkModeToggle";
import Logo from "./Logo";
import NotificationsMenu, { type AppNotification } from "./NotificationsMenu";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({
  notifications,
  avatarLabel,
  onboarded,
  defaultCollapsed,
  plan,
  user,
  workspaces,
  activeWorkspaceId,
  children,
}: {
  notifications: AppNotification[];
  avatarLabel: string;
  onboarded: boolean;
  defaultCollapsed: boolean;
  plan: Plan;
  user: { name: string; email: string; initials: string };
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function setCollapsed(v: boolean) {
    setCollapsedState(v);
    document.cookie = `loglead_sidebar=${v ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  // Pre-onboarding: no nav (every section redirects to /onboarding). Keep the
  // logo + account reachable.
  if (!onboarded) {
    return (
      <div className="min-h-screen bg-canvas">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
            <Link href="/dashboard" aria-label="LogLead — accueil">
              <Logo size={26} withWordmark />
            </Link>
            <div className="flex items-center gap-1">
              <NotificationsMenu notifications={notifications} />
              <DarkModeToggle />
              <Link
                href="/settings"
                aria-label="Mon compte"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white"
              >
                {avatarLabel}
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        plan={plan}
        user={user}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onHamburger={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
