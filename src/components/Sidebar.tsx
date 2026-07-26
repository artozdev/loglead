"use client";

import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gem,
  Home,
  Inbox,
  Lightbulb,
  Radar,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Plan } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import Logo from "./Logo";
import SidebarUserMenu from "./SidebarUserMenu";

type NavIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

type NavItem = {
  href: string;
  labelKey: string; // i18n key (see lib/i18n.ts)
  icon: NavIcon;
  hintKey?: string; // hover sub-label (title tooltip)
  soon?: boolean; // greyed, non-clickable, "Bientôt" badge
  proOnly?: boolean; // Pro plan only — greyed with a "Bientôt" badge otherwise
  badge?: string; // small badge next to the label (e.g. "Bêta Pro")
};

// Sidebar grouped by product intent. Labels resolve via i18n (English default,
// French opt-in in Settings > Appearance). B2B / LinkedIn-first naming.
const NAV_SECTIONS: { labelKey: string | null; items: NavItem[] }[] = [
  {
    labelKey: null,
    items: [
      { href: "/dashboard", labelKey: "nav.home", icon: Home, hintKey: "nav.home.hint" },
      {
        href: "/logagent",
        labelKey: "nav.growthPartner",
        icon: Bot,
        hintKey: "nav.growthPartner.hint",
        proOnly: true,
        badge: "Beta Pro",
      },
    ],
  },
  {
    labelKey: "nav.section.create",
    items: [
      { href: "/post-generator", labelKey: "nav.contentEngine", icon: Sparkles, hintKey: "nav.contentEngine.hint" },
      { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays, hintKey: "nav.calendar.hint" },
    ],
  },
  {
    labelKey: "nav.section.analyze",
    items: [
      { href: "/algo-insider", labelKey: "nav.linkedinIntelligence", icon: Lightbulb, hintKey: "nav.linkedinIntelligence.hint" },
      { href: "/geo", labelKey: "nav.aiVisibility", icon: Radar, hintKey: "nav.aiVisibility.hint" },
    ],
  },
  {
    labelKey: "nav.section.acquire",
    items: [
      { href: "/leads", labelKey: "nav.pipeline", icon: Users, hintKey: "nav.pipeline.hint" },
      { href: "/inbox", labelKey: "nav.outreach", icon: Inbox, hintKey: "nav.outreach.hint" },
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
  user,
  workspaces,
  activeWorkspaceId,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  plan: Plan;
  user: SidebarUser;
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
}) {
  const pathname = usePathname();
  const { t } = useLocale();

  function inner(drawer: boolean) {
    const isCollapsed = drawer ? false : collapsed;
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
            {isCollapsed ? <Logo size={28} /> : <Logo size={26} withWordmark />}
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
                  const I = item.icon;
                  const label = t(item.labelKey);
                  const hint = item.hintKey ? t(item.hintKey) : undefined;
                  // Pro-only items are locked (greyed + "Bientôt") on other plans.
                  const locked = item.soon || (item.proOnly && plan !== "pro");
                  if (locked) {
                    return (
                      <div
                        key={item.href}
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
                  const isActive = active(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => drawer && setMobileOpen(false)}
                      title={isCollapsed ? label : hint}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center rounded-[7px] text-[13.5px] transition duration-150 ${
                        isCollapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2"
                      } ${
                        isActive
                          ? "bg-primary/[0.08] font-medium text-primary"
                          : "font-normal text-muted hover:bg-surface-hover hover:text-ink"
                      }`}
                    >
                      <I
                        size={17}
                        strokeWidth={1.5}
                        className={`shrink-0 ${isActive ? "" : "opacity-60"}`}
                      />
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
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom — Pro card + user block */}
        <div className="shrink-0 space-y-2 px-2.5 py-3">
          {plan !== "pro" &&
            (isCollapsed ? (
              <Link
                href="/pricing"
                onClick={() => drawer && setMobileOpen(false)}
                title="Passe à Pro"
                aria-label="Passe à Pro"
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white"
              >
                <Gem size={16} strokeWidth={1.5} />
              </Link>
            ) : (
              <div className="rounded-xl border border-line bg-surface p-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-gradient text-white">
                    <Gem size={13} strokeWidth={1.5} />
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    Passe à Pro !
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Génère plus de contenu, accède aux analytics avancées.
                </p>
                <Link
                  href="/pricing"
                  onClick={() => drawer && setMobileOpen(false)}
                  className="btn-primary mt-2.5 w-full !py-2 text-xs"
                >
                  Voir les offres
                </Link>
              </div>
            ))}

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
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-smooth md:flex ${
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
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-line bg-surface shadow-pop">
            {inner(true)}
          </aside>
        </div>
      )}
    </>
  );
}
