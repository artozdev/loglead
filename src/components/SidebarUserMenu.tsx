"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Plan } from "@/lib/types";

type WorkspaceRef = { id: string; name: string };

export default function SidebarUserMenu({
  name,
  email,
  initials,
  plan,
  workspaces,
  activeWorkspaceId,
  collapsed,
  onNavigate,
}: {
  name: string;
  email: string;
  initials: string;
  plan: Plan;
  workspaces: WorkspaceRef[];
  activeWorkspaceId: string;
  collapsed: boolean;
  onNavigate?: () => void; // close mobile drawer on navigation
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lang, setLang] = useState("fr");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLang(localStorage.getItem("loglead-lang") || "fr");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setLangOpen(false);
  }

  function pickLang(l: string) {
    setLang(l);
    localStorage.setItem("loglead-lang", l);
    setLangOpen(false);
  }

  async function switchWorkspace(id: string) {
    if (id === activeWorkspaceId) return close();
    setBusy(true);
    try {
      await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    if (!window.confirm("Se déconnecter de LogLead ?")) return;
    // Hit the GET /logout route — it clears the session cookie on the redirect
    // response itself, so logout always applies (even if a fetch wouldn't).
    window.location.href = "/logout";
  }

  const memberLocked = plan === "starter";

  return (
    <div className="relative border-t border-line pt-2">
      {open && (
        <button
          aria-hidden
          onClick={close}
          className="fixed inset-0 z-[999] cursor-default bg-transparent"
        />
      )}

      {open && (
        <div className="animate-menu-up fixed inset-x-[5%] bottom-4 z-[1000] w-[90%] rounded-[10px] border border-line bg-surface p-1.5 shadow-pop md:absolute md:inset-x-auto md:bottom-[calc(100%+8px)] md:left-0 md:w-[220px]">
          {/* User header */}
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar initials={initials} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-ink">{name}</div>
              <div className="truncate text-[11px] text-faint">{email}</div>
            </div>
          </div>

          <Divider />

          <MenuLink href="/settings" icon="gear" label="Paramètres" onClick={() => { close(); onNavigate?.(); }} />
          {memberLocked ? (
            <div
              title="Disponible à partir du plan Growth"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-faint"
            >
              <Icon name="users" /> Membres
              <Icon name="lock" size={13} />
            </div>
          ) : (
            <MenuLink href="/settings?tab=team" icon="users" label="Membres" onClick={() => { close(); onNavigate?.(); }} />
          )}
          <MenuLink href="/settings?tab=facturation" icon="card" label="Plan & billing" onClick={() => { close(); onNavigate?.(); }} />
          <MenuLink
            href="/affiliation"
            icon="handshake"
            label="Affiliation"
            sublabel="Gagne 40% à vie"
            onClick={() => { close(); onNavigate?.(); }}
          />

          {/* Language (inline submenu) */}
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink transition hover:bg-surface-hover"
          >
            <Icon name="globe" />
            <span className="flex-1 text-left">Langue</span>
            <span className={`transition ${langOpen ? "rotate-90" : ""}`}><Icon name="chevronRight" size={14} /></span>
          </button>
          {langOpen && (
            <div className="ml-4 border-l border-line pl-1">
              <LangOption flag="🇫🇷" label="Français" active={lang === "fr"} onClick={() => pickLang("fr")} />
              <LangOption flag="🇬🇧" label="English" active={lang === "en"} onClick={() => pickLang("en")} />
            </div>
          )}

          <Divider />

          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-danger transition hover:bg-danger/5"
          >
            <Icon name="logout" /> Se déconnecter
          </button>
        </div>
      )}

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? name : undefined}
        className={`flex w-full items-center rounded-lg transition hover:bg-surface-hover ${
          collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-3 py-2.5"
        }`}
      >
        <Avatar initials={initials} />
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13px] font-medium text-ink">{name}</div>
              <div className="truncate text-[11px] text-faint">{email}</div>
            </div>
            <span className="text-faint"><Icon name="chevronRight" size={16} /></span>
          </>
        )}
      </button>

      {createOpen && (
        <CreateWorkspaceModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); router.refresh(); }} />
      )}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
      {initials}
    </span>
  );
}

function Divider() {
  return <div className="my-1 border-t border-line" />;
}

function MenuLink({
  href,
  icon,
  label,
  sublabel,
  onClick,
}: {
  href: string;
  icon: IconName;
  label: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink transition hover:bg-surface-hover"
    >
      <Icon name={icon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {sublabel && <span className="block truncate text-[11px] font-medium text-success">{sublabel}</span>}
      </span>
    </Link>
  );
}

function LangOption({ flag, label, active, onClick }: { flag: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-ink transition hover:bg-surface-hover">
      <span>{flag}</span>
      <span className="flex-1 text-left">{label}</span>
      {active && <span className="text-primary"><Icon name="check" size={14} /></span>}
    </button>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Échec de la création.");
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="modal-overlay absolute inset-0 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h3 className="font-display text-lg font-semibold text-ink">Créer un workspace</h3>
        <p className="mt-1 text-sm text-muted">Chaque workspace correspond à une startup, avec ses propres contenus et leads.</p>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div>
            <label className="label">Nom de la startup</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ex : Acme" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={busy || !name.trim()} className="btn-primary">
              {busy ? "…" : "Créer le workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Icons (sidebar visual language) --------------------------------------
type IconName = keyof typeof ICONS;
const ICONS = {
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.7-1.3-1.7-3-2 .8a7.6 7.6 0 0 0-2.6-1.5L14.2 3H9.8l-.6 2a7.6 7.6 0 0 0-2.6 1.5l-2-.8-1.7 3 1.7 1.3a7.6 7.6 0 0 0 0 3l-1.7 1.3 1.7 3 2-.8a7.6 7.6 0 0 0 2.6 1.5l.6 2h4.4l.6-2a7.6 7.6 0 0 0 2.6-1.5l2 .8 1.7-3z" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
} as const;

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}
