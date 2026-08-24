"use client";

import {
  BarChart3,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  PenSquare,
  Sparkles,
  Telescope,
  Users,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Plan } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import Logo from "./Logo";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import SidebarUserMenu from "./SidebarUserMenu";

type NavIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

type NavItem = {
  href?: string; // omit for a parent group that only expands its children
  labelKey: string; // i18n key (see lib/i18n.ts)
  icon: NavIcon;
  hintKey?: string; // hover sub-label (title tooltip)
  soon?: boolean; // greyed, non-clickable, "Bientôt" badge
  proOnly?: boolean; // Pro plan only — greyed with a "Bientôt" badge otherwise
  badge?: string; // small badge next to the label (e.g. "Bêta Pro")
  children?: NavItem[]; // collapsible sub-menu
};

// Sidebar grouped by product intent. Labels resolve via i18n (English default,
// French opt-in in Settings > Appearance). B2B / LinkedIn-first naming.
const NAV_SECTIONS: { labelKey: string | null; items: NavItem[] }[] = [
  {
    labelKey: null,
    items: [
      { href: "/dashboard", labelKey: "nav.home", icon: Home, hintKey: "nav.home.hint" },
      { href: "/logagent", labelKey: "nav.logagent", icon: Bot, hintKey: "nav.logagent.hint", badge: "New" },
    ],
  },
  {
    labelKey: "nav.section.dashboard",
    items: [
      { href: "/market", labelKey: "nav.marketIntelligence", icon: Telescope, hintKey: "nav.marketIntelligence.hint" },
      {
        labelKey: "nav.group.content",
        icon: PenSquare,
        children: [
          { href: "/post-generator", labelKey: "nav.contentEngine", icon: Sparkles, hintKey: "nav.contentEngine.hint" },
          { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays, hintKey: "nav.calendar.hint" },
        ],
      },
      { href: "/leads", labelKey: "nav.pipeline", icon: Users, hintKey: "nav.pipeline.hint" },
      { href: "/linkedin-analytics", labelKey: "nav.linkedinAnalytics", icon: BarChart3, hintKey: "nav.linkedinAnalytics.hint" },
    ],
  },
];

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type SidebarUser = { name: string; email: string; initials: string };

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  plan,
  credits = 0,
  creditsQuota = 0,
  user,
  workspaces,
  activeWorkspaceId,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  plan: Plan;
  credits?: number;
  creditsQuota?: number;
  user: SidebarUser;
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  // Groups start open if they contain the active route, but can be freely
  // collapsed/re-opened afterwards (open state is purely user-controlled).
  const [expanded, setExpanded] = useState<string[]>(() =>
    NAV_SECTIONS.flatMap((s) => s.items)
      .filter((it) => it.children?.some((c) => c.href && active(pathname, c.href)))
      .map((it) => it.labelKey),
  );

  const groupHasActiveChild = (item: NavItem) =>
    (item.children ?? []).some((c) => c.href && active(pathname, c.href));
  const isGroupOpen = (item: NavItem) => expanded.includes(item.labelKey);
  const toggleGroup = (key: string) =>
    setExpanded((e) => (e.includes(key) ? e.filter((k) => k !== key) : [...e, key]));

  function inner(drawer: boolean) {
    const isCollapsed = drawer ? false : collapsed;

    // Renders a single leaf nav entry (a link, or a locked/soon row).
    function renderLeaf(item: NavItem) {
      const I = item.icon;
      const label = t(item.labelKey);
      const hint = item.hintKey ? t(item.hintKey) : undefined;
      const locked = item.soon || (item.proOnly && plan !== "pro");
      if (locked) {
        return (
          <div
            key={item.href ?? item.labelKey}
            aria-disabled="true"
            title={item.proOnly ? "Disponible sur le plan Pro" : "Cette fonctionnalité arrive bientôt"}
            className={`flex cursor-default select-none items-center rounded-[7px] text-[13.5px] text-muted opacity-40 ${
              isCollapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2"
            }`}
          >
            <I size={17} strokeWidth={1.5} className="shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{label}</span>
                <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {t("common.soon")}
                </span>
              </>
            )}
          </div>
        );
      }
      const isActive = item.href ? active(pathname, item.href) : false;
      return (
        <Link
          key={item.href}
          href={item.href!}
          onClick={() => drawer && setMobileOpen(false)}
          title={isCollapsed ? label : hint}
          aria-current={isActive ? "page" : undefined}
          className={`flex items-center rounded-[7px] text-[13.5px] transition duration-150 ${
            isCollapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2"
          } ${
            isActive
              ? "bg-primary/[0.08] font-medium text-primary"
              : "font-normal text-ink hover:bg-surface-hover"
          }`}
        >
          <I size={17} strokeWidth={1.5} className={`shrink-0 ${isActive ? "" : "opacity-60"}`} />
          {!isCollapsed && (
            <>
              <span className="truncate">{label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      );
    }

    return (
      <div className="flex h-full flex-col">
        {/* Logo + collapse / close */}
        <div
          className={`flex items-center border-b border-line px-3 py-3.5 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            href="/dashboard"
            onClick={() => drawer && setMobileOpen(false)}
            aria-label="LogLead — accueil"
            className="flex items-center rounded-lg"
          >
            {isCollapsed ? <Logo size={28} appIcon /> : <Logo size={26} withWordmark appIcon />}
          </Link>
          {drawer ? (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
          ) : (
            !isCollapsed && (
              <button
                onClick={() => setCollapsed(true)}
                aria-label="Réduire la barre latérale"
                title="Réduire"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
              >
                <ChevronLeft size={17} strokeWidth={1.5} />
              </button>
            )
          )}
        </div>

        {/* Workspace switcher — under the logo */}
        <div className="border-b border-line py-1">
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            collapsed={isCollapsed}
            onNavigate={() => drawer && setMobileOpen(false)}
          />
        </div>

        {!drawer && isCollapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Agrandir la barre latérale"
            title="Agrandir"
            className="mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
          >
            <ChevronRight size={17} strokeWidth={1.5} />
          </button>
        )}

        {/* Navigation — grouped sections */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.labelKey ?? "main"}>
              {/* Section label: presentational only; spacing via padding, no <hr> */}
              {section.labelKey && !isCollapsed && (
                <p
                  role="presentation"
                  className="select-none px-3 pb-1 pt-4 text-[11px] font-normal text-faint"
                >
                  {t(section.labelKey)}
                </p>
              )}
              {section.labelKey && isCollapsed && si > 0 && <div className="mt-3" />}

              <div className="space-y-px">
                {section.items.map((item) => {
                  // Parent group with a collapsible sub-menu.
                  if (item.children) {
                    // Collapsed rail: show the children directly as icons.
                    if (isCollapsed) return item.children.map((c) => renderLeaf(c));
                    const open = isGroupOpen(item);
                    const PI = item.icon;
                    const parentActive = groupHasActiveChild(item);
                    return (
                      <div key={item.labelKey}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.labelKey)}
                          className={`flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px] transition duration-150 ${
                            parentActive
                              ? "font-medium text-ink"
                              : "font-normal text-ink hover:bg-surface-hover"
                          }`}
                        >
                          <PI size={17} strokeWidth={1.5} className={`shrink-0 ${parentActive ? "" : "opacity-60"}`} />
                          <span className="truncate">{t(item.labelKey)}</span>
                          <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            className={`ml-auto shrink-0 text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                        {open && (
                          <div className="mt-px space-y-px pl-3.5">
                            {item.children.map((c) => renderLeaf(c))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return renderLeaf(item);
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom — choose-a-plan + credits card + user block */}
        <div className="shrink-0 space-y-2 px-2.5 py-3">
          {isCollapsed ? (
            <Link
              href="/settings?tab=facturation"
              title="Choisir un plan"
              aria-label="Choisir un plan"
              onClick={() => drawer && setMobileOpen(false)}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white transition hover:opacity-90"
            >
              <Zap size={16} strokeWidth={2.2} />
            </Link>
          ) : (
            <Link
              href="/settings?tab=facturation"
              onClick={() => drawer && setMobileOpen(false)}
              className="btn-primary flex w-full items-center justify-center gap-1.5 !py-1.5 text-[12px] font-semibold"
            >
              <Zap size={13} strokeWidth={2.4} /> Choisir un plan
            </Link>
          )}

          {(() => {
            const quota = creditsQuota > 0 ? creditsQuota : Math.max(credits, 200);
            const pct = Math.min(100, Math.round((credits / quota) * 100));
            const openCredits = () => {
              if (drawer) setMobileOpen(false);
              window.dispatchEvent(new CustomEvent("loglead:open-credits"));
            };

            if (isCollapsed) {
              return (
                <button
                  onClick={openCredits}
                  title="Vos crédits"
                  aria-label="Vos crédits"
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white"
                >
                  <Zap size={16} strokeWidth={1.5} />
                </button>
              );
            }

            return (
              <button
                onClick={openCredits}
                className="w-full rounded-xl border border-line bg-surface-hover/40 p-3 text-left transition hover:border-primary/40 hover:bg-surface-hover/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Zap size={12} strokeWidth={1.5} className="text-primary" /> Crédits
                  </span>
                  <span className="num text-[12px] font-semibold text-ink">
                    {credits.toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-muted">
                    {creditsQuota > 0 ? `sur ${quota.toLocaleString("fr-FR")} / mois` : "Crédits d'essai"}
                  </p>
                  <span className="text-[11px] font-medium text-primary">Voir mes crédits →</span>
                </div>
              </button>
            );
          })()}

          <SidebarUserMenu
            name={user.name}
            email={user.email}
            initials={user.initials}
            plan={plan}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            collapsed={isCollapsed}
            onNavigate={() => drawer && setMobileOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <aside
        className={`force-dark sticky top-0 hidden h-screen shrink-0 flex-col bg-[#0A0A0A] text-ink transition-[width] duration-200 ease-smooth md:flex ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {inner(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 modal-overlay backdrop-blur-sm"
          />
          <aside className="force-dark absolute left-0 top-0 h-full w-72 bg-[#0A0A0A] text-ink shadow-pop">
            {inner(true)}
          </aside>
        </div>
      )}
    </>
  );
}
