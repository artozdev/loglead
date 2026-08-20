"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PLAN_CARDS, type PlanCard } from "@/lib/credits";
import type { EmailPrefs, Plan, Profile } from "@/lib/types";
import ProfileForm from "./ProfileForm";
import { LOCALES } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";
import { useTheme, type Theme } from "./ThemeProvider";

// ---------------------------------------------------------------------------
// Paramètres v3 — horizontal tabs, 640px flat content. Sections open with a
// large 20px title + hairline separator (mockup style); secondary actions are
// grey pill buttons; primary saves only appear on dirty state.
// ---------------------------------------------------------------------------

type TabId =
  | "compte" | "apparence" | "notifications"
  | "saas" | "connexions" | "team" | "facturation";

const TABS: { id: TabId; label: string }[] = [
  { id: "compte", label: "Compte" },
  { id: "apparence", label: "Apparence" },
  { id: "notifications", label: "Notifications" },
  { id: "saas", label: "Mon SaaS" },
  { id: "connexions", label: "Connexions" },
  { id: "team", label: "Équipe" },
  { id: "facturation", label: "Facturation" },
];

const PLAN_META: Record<Plan, { label: string; price: string }> = {
  free: { label: "Gratuit", price: "0 € / mois" },
  starter: { label: "Starter", price: "29 € / mois" },
  growth: { label: "Growth", price: "59 € / mois" },
  pro: { label: "Pro", price: "99 € / mois" },
};

export type SettingsHubProps = {
  email: string;
  firstName: string;
  activeName: string;
  plan: Plan;
  profile: Profile | null;
  usage: { content: number; analyses: number; workspaces: number };
  renewalDate: string;
  initialTab?: string;
  emailPrefs: EmailPrefs;
  linkedin: { connected: boolean; name?: string };
  linkedinProfileUrl?: string;
  linkedinAutoDetect?: boolean;
};

export default function SettingsHub(props: SettingsHubProps) {
  const valid = TABS.some((t) => t.id === props.initialTab);
  const [tab, setTab] = useState<TabId>(valid ? (props.initialTab as TabId) : "compte");
  const [dirty, setDirty] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Keep the active tab in sync with the ?tab= URL param, so navigating to
  // /settings?tab=facturation switches tabs even when already on /settings.
  const searchParams = useSearchParams();
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t as TabId);
  }, [searchParams]);

  function go(next: TabId) {
    if (next === tab) return;
    if (dirty && !window.confirm("Vous avez des modifications non enregistrées. Quitter quand même ?")) return;
    setDirty(false);
    setTab(next);
  }

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ email: props.email, workspace: props.activeName, plan: props.plan, profile: props.profile }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "loglead-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setMenuOpen(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-medium tracking-tight text-ink">Paramètres</h1>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Actions rapides"
            aria-haspopup="menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
          </button>
          {menuOpen && (
            <>
              <button aria-hidden onClick={() => setMenuOpen(false)} className="fixed inset-0 z-10 cursor-default" />
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[10px] border border-line bg-surface py-1 shadow-pop">
                <button onClick={exportData} className="block w-full px-3 py-2 text-left text-[13px] text-ink transition hover:bg-surface-hover">
                  Exporter mes données
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                  className="block w-full px-3 py-2 text-left text-[13px] text-danger transition hover:bg-danger/5"
                >
                  Supprimer mon compte
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              aria-current={on ? "page" : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px] transition duration-150 ${
                on
                  ? "border-primary font-medium text-ink"
                  : "border-transparent font-normal text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mr-auto mt-8 max-w-[900px] pb-16">
        {tab === "compte" && (
          <CompteTab
            email={props.email}
            firstName={props.firstName}
            activeName={props.activeName}
            onDirty={setDirty}
            onDelete={() => setDeleteOpen(true)}
          />
        )}
        {tab === "apparence" && <ApparenceTab />}
        {tab === "notifications" && <NotificationsTab prefs={props.emailPrefs} />}
        {tab === "saas" && (
          <div>
            <SectionHeader title="Profil de votre SaaS" />
            <p className="-mt-3 mb-6 text-[13px] text-muted">
              Ces informations personnalisent toutes vos recommandations et contenus générés.
            </p>
            <ProfileForm initial={props.profile} onDirtyChange={setDirty} />
          </div>
        )}
        {tab === "connexions" && <ConnexionsTab linkedin={props.linkedin} profileUrl={props.linkedinProfileUrl} autoDetect={props.linkedinAutoDetect} />}
        {tab === "team" && <TeamTab plan={props.plan} email={props.email} firstName={props.firstName} />}
        {tab === "facturation" && <FacturationTab plan={props.plan} renewalDate={props.renewalDate} />}
      </div>

      {deleteOpen && <DeleteAccountModal email={props.email} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

// ---------- Shared bits ------------------------------------------------------

// Large section title + hairline separator (mockup style).
function SectionHeader({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-[20px] font-medium text-ink">{title}</h2>
      <div className="mb-6 mt-3 border-t border-line" />
    </div>
  );
}

// Grey pill secondary button ("Changer l'email", "Se déconnecter"…).
function BtnGrey({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick ?? (() => alert("Bientôt disponible (démo)."))}
      className={`shrink-0 rounded-lg bg-surface-hover px-4 py-2 text-[13px] font-medium transition hover:brightness-[0.98] ${
        danger ? "text-danger" : "text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] text-muted">{children}</label>;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-ink" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// Label (14px medium) + description + trailing control — mockup row style.
function SettingRow({
  label,
  desc,
  control,
  danger,
}: {
  label: string;
  desc: string;
  control: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <div className={`text-[14px] font-medium ${danger ? "text-danger" : "text-ink"}`}>{label}</div>
        <div className="mt-0.5 text-[13px] text-muted">{desc}</div>
      </div>
      {control}
    </div>
  );
}

function ToggleSettingRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return <SettingRow label={label} desc={desc} control={<Toggle on={on} onChange={setOn} />} />;
}

// ---------- Compte (Profil + Sécurité fusionnés) -----------------------------

const ROLES = ["Fondateur", "Co-fondateur", "CMO", "Développeur", "Autre"];

function CompteTab({
  email,
  firstName,
  activeName,
  onDirty,
  onDelete,
}: {
  email: string;
  firstName: string;
  activeName: string;
  onDirty: (v: boolean) => void;
  onDelete: () => void;
}) {
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [dirty, setDirtyState] = useState(false);
  const [saved, setSaved] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [support, setSupport] = useState(true);
  const [pwOpen, setPwOpen] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  function touch() {
    setDirtyState(true);
    setSaved(false);
    onDirty(true);
  }
  function save() {
    setDirtyState(false);
    setSaved(true);
    onDirty(false);
  }

  const initials = (first.charAt(0) + (last.charAt(0) || "")).toUpperCase() || "?";

  return (
    <div>
      {/* ----- Mon profil ----- */}
      <SectionHeader title="Mon profil" />

      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
          {initials}
        </span>
        <div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-canvas transition hover:brightness-110">
              + Changer l&apos;image
            </button>
            <BtnGrey>Supprimer l&apos;image</BtnGrey>
          </div>
          <p className="mt-2 text-[12px] text-muted">PNG, JPEG ou GIF · max 2MB</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Prénom</FieldLabel>
          <input className="input h-11 text-[13px]" value={first} onChange={(e) => { setFirst(e.target.value); touch(); }} />
        </div>
        <div>
          <FieldLabel>Nom</FieldLabel>
          <input className="input h-11 text-[13px]" value={last} onChange={(e) => { setLast(e.target.value); touch(); }} placeholder="Nom" />
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel>Nom du SaaS</FieldLabel>
        <input className="input h-11 text-[13px]" value={activeName} disabled />
      </div>
      <div className="mt-4">
        <FieldLabel>Rôle</FieldLabel>
        <select className="input h-11 text-[13px]" value={role} onChange={(e) => { setRole(e.target.value); touch(); }}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        {saved && <span className="text-[13px] text-success">Profil enregistré.</span>}
        {dirty && <button onClick={save} className="btn-primary !py-2 text-sm">Enregistrer</button>}
      </div>

      {/* ----- Sécurité du compte ----- */}
      <SectionHeader title="Sécurité du compte" className="mt-12" />

      <div>
        <FieldLabel>Email</FieldLabel>
        <div className="flex items-center gap-3">
          <input className="input h-11 max-w-[340px] text-[13px]" value={email} disabled />
          <BtnGrey>Changer l&apos;email</BtnGrey>
        </div>
      </div>
      <div className="mt-5">
        <FieldLabel>Mot de passe</FieldLabel>
        <div className="flex items-center gap-3">
          <input className="input h-11 max-w-[340px] text-[13px]" value="••••••••••••" disabled type="password" />
          <BtnGrey onClick={() => setPwOpen(true)}>Changer le mot de passe</BtnGrey>
        </div>
      </div>
      <div className="mt-4">
        <SettingRow
          label="Vérification en 2 étapes"
          desc="Ajoute une couche de sécurité supplémentaire à votre connexion."
          control={<Toggle on={twoFa} onChange={setTwoFa} />}
        />
      </div>

      {/* ----- Accès support ----- */}
      <SectionHeader title="Accès support" className="mt-12" />

      <SettingRow
        label="Accès support"
        desc="Autoriser l'équipe LogLead à accéder à votre compte pour vous aider."
        control={<Toggle on={support} onChange={setSupport} />}
      />
      <SettingRow
        label="Déconnecter tous les appareils"
        desc={loggedOut ? "Toutes les autres sessions ont été déconnectées." : "Déconnecte toutes les sessions actives sauf celle-ci."}
        control={<BtnGrey onClick={() => setLoggedOut(true)}>Se déconnecter</BtnGrey>}
      />

      {/* ----- Zone de danger (no header) ----- */}
      <div className="mt-8">
        <SettingRow
          danger
          label="Supprimer mon compte"
          desc="Supprime définitivement votre compte et tous vos contenus."
          control={<BtnGrey onClick={onDelete}>Supprimer le compte</BtnGrey>}
        />
      </div>

      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) return setMsg({ ok: false, text: "Les mots de passe ne correspondent pas." });
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Échec." });
      setMsg({ ok: true, text: "Mot de passe mis à jour." });
      setCur(""); setNext(""); setConfirm("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="modal-overlay absolute inset-0 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h3 className="font-display text-lg font-semibold text-ink">Changer le mot de passe</h3>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <FieldLabel>Mot de passe actuel</FieldLabel>
            <input type="password" autoComplete="current-password" className="input h-11 text-[13px]" value={cur} onChange={(e) => setCur(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Nouveau mot de passe</FieldLabel>
            <input type="password" autoComplete="new-password" minLength={8} className="input h-11 text-[13px]" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Confirmer le nouveau mot de passe</FieldLabel>
            <input type="password" autoComplete="new-password" className="input h-11 text-[13px]" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {msg && <p className={`text-[13px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary !py-2 text-sm">Fermer</button>
            <button type="submit" disabled={busy || !cur || !next} className="btn-primary !py-2 text-sm">Mettre à jour</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAccountModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const match = value.trim().toLowerCase() === email.toLowerCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="modal-overlay absolute inset-0 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h3 className="font-display text-lg font-semibold text-ink">Supprimer définitivement le compte</h3>
        <p className="mt-1 text-[13px] text-muted">
          Cette action est irréversible. Saisis ton adresse email <span className="font-medium text-ink">{email}</span> pour confirmer.
        </p>
        <input type="email" className="input mt-4 h-11 text-[13px]" value={value} onChange={(e) => setValue(e.target.value)} placeholder={email} />
        {msg && <p className="mt-2 text-[13px] text-warning">{msg}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary !py-2 text-sm">Annuler</button>
          <button
            onClick={() => setMsg("La suppression de compte n'est pas disponible en démo.")}
            disabled={!match}
            className="btn bg-danger !py-2 text-sm text-white hover:brightness-95 disabled:opacity-50"
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Apparence ----------------------------------------------------------

function ThemePreview({ variant }: { variant: Theme }) {
  const L = { app: "#FFFFFF", side: "#F8FAFC", card: "#FFFFFF", line: "#E2E8F0" };
  const D = { app: "#0C0E14", side: "#111318", card: "#141620", line: "#1E2235" };
  return (
    <svg viewBox="0 0 120 74" className="h-full w-full rounded-md" preserveAspectRatio="none">
      <rect x="0" y="0" width="120" height="74" fill={variant === "dark" ? D.app : L.app} />
      <rect x="0" y="0" width="30" height="74" fill={variant === "dark" ? D.side : L.side} />
      {variant === "system" && <rect x="60" y="0" width="60" height="74" fill={D.app} />}
      <rect x="38" y="20" width="34" height="20" rx="2" fill={variant === "dark" ? D.card : L.card} stroke={variant === "dark" ? D.line : L.line} />
      <rect x="80" y="20" width="32" height="20" rx="2" fill={variant === "system" || variant === "dark" ? D.card : L.card} stroke={variant === "system" || variant === "dark" ? D.line : L.line} />
      <rect x="38" y="48" width="74" height="18" rx="2" fill={variant === "dark" ? D.card : L.card} stroke={variant === "dark" ? D.line : L.line} />
      <rect x="6" y="16" width="18" height="3" rx="1.5" fill="#0051FF" />
      <rect x="6" y="24" width="14" height="3" rx="1.5" fill={variant === "dark" ? "#2A2F45" : "#CBD5E1"} />
      <rect x="6" y="32" width="16" height="3" rx="1.5" fill={variant === "dark" ? "#2A2F45" : "#CBD5E1"} />
    </svg>
  );
}

function ApparenceTab() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const [restored, setRestored] = useState(false);

  function restore() {
    setRestored(true);
    void fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: false }),
    });
  }

  const options: { id: Theme; emoji: string; label: string }[] = [
    { id: "light", emoji: "☀️", label: "Clair" },
    { id: "dark", emoji: "🌙", label: "Sombre" },
    { id: "system", emoji: "💻", label: "Système" },
  ];
  return (
    <div>
      <SectionHeader title={t("settings.appearance")} />

      {/* Language */}
      <div className="text-[14px] font-medium text-ink">{t("settings.language")}</div>
      <p className="mt-0.5 text-[13px] text-muted">{t("settings.language.desc")}</p>
      <div className="mt-3 grid max-w-[420px] gap-3 sm:grid-cols-2">
        {LOCALES.map((l) => {
          const on = locale === l.value;
          return (
            <button
              key={l.value}
              onClick={() => setLocale(l.value)}
              aria-pressed={on}
              className={`flex items-center gap-2.5 rounded-[10px] border p-3 transition ${
                on ? "border-2 border-primary bg-primary/5" : "border border-line hover:border-line-strong"
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span className={`text-[13px] ${on ? "font-medium text-primary" : "text-ink"}`}>{l.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 text-[14px] font-medium text-ink">{t("settings.theme")}</div>
      <p className="mt-0.5 text-[13px] text-muted">Choisissez l&apos;apparence de l&apos;interface.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {options.map((t) => {
          const on = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={on}
              className={`rounded-[10px] border p-2 text-center transition ${
                on ? "border-2 border-primary bg-primary/5" : "border border-line hover:border-line-strong"
              }`}
            >
              <div className="h-[80px] w-full overflow-hidden rounded-md border border-line">
                <ThemePreview variant={t.id} />
              </div>
              <div className={`mt-2 text-[13px] ${on ? "font-medium text-primary" : "text-ink"}`}>
                {t.emoji} {t.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="text-[14px] font-medium text-ink">Fuseau horaire</div>
        <p className="mt-0.5 text-[13px] text-muted">Utilisé pour les créneaux de publication recommandés.</p>
        <select className="input mt-3 h-11 max-w-[340px] text-[13px]">
          <option>Europe/Paris (GMT+1)</option>
          <option>Europe/London (GMT)</option>
          <option>America/New_York (GMT-5)</option>
        </select>
      </div>

      <div className="mt-10">
        <SettingRow
          label="Guide de démarrage"
          desc={restored ? "Le guide s'affichera de nouveau sur le tableau de bord." : "Réaffiche la checklist de démarrage sur le tableau de bord."}
          control={<BtnGrey onClick={restore}>Réafficher</BtnGrey>}
        />
      </div>
    </div>
  );
}

// ---------- Notifications --------------------------------------------------------

function NotificationsTab({ prefs }: { prefs: EmailPrefs }) {
  // The three transactional toggles persist server-side; the rest stay
  // demo-only until their emails exist.
  function EmailPrefRow({
    field,
    label,
    desc,
  }: {
    field: keyof EmailPrefs;
    label: string;
    desc: string;
  }) {
    const [on, setOn] = useState(prefs[field] !== false);
    return (
      <SettingRow
        label={label}
        desc={desc}
        control={
          <Toggle
            on={on}
            onChange={(v) => {
              setOn(v);
              void fetch("/api/settings/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: v }),
              });
            }}
          />
        }
      />
    );
  }

  return (
    <div>
      <SectionHeader title="Notifications email" />
      <EmailPrefRow field="dailyBrief" label="Brief quotidien" desc="Reçois chaque matin tes contenus du jour prêts à valider (plan Pro)." />
      <EmailPrefRow field="weeklySummary" label="Résumé hebdomadaire" desc="Un bilan de tes performances chaque lundi." />
      <EmailPrefRow field="newLead" label="Nouveau lead capté" desc="Sois prévenu par email dès qu'un prospect arrive dans ton CRM." />
      <ToggleSettingRow label="Mises à jour de l'Algo Insider" desc="Sois alerté quand les recommandations de ta niche changent." defaultOn />
      <ToggleSettingRow label="Nouveautés LogLead" desc="Nouvelles fonctionnalités et améliorations du produit." />

      <SectionHeader title="Notifications in-app" className="mt-12" />
      <ToggleSettingRow label="Alertes tendances" desc="Opportunités détectées dans ta niche en temps réel." defaultOn />
      <ToggleSettingRow label="Rappels de publication" desc="Rappel avant chaque contenu planifié." defaultOn />
    </div>
  );
}

// ---------- Connexions ------------------------------------------------------------

function ConnexionsTab({ linkedin, profileUrl, autoDetect }: { linkedin: { connected: boolean; name?: string }; profileUrl?: string; autoDetect?: boolean }) {
  const [state, setState] = useState<Record<string, string | null>>({
    LinkedIn: linkedin.connected ? linkedin.name ?? "Compte LinkedIn" : null,
    Gmail: null,
    WhatsApp: null,
  });
  // V1 channels : LinkedIn (OAuth officiel) actif ; Gmail & WhatsApp à venir.
  const rows: { name: string; dot: string; comingSoon?: boolean }[] = [
    { name: "LinkedIn", dot: "var(--color-linkedin)" },
    { name: "Gmail", dot: "#EA4335", comingSoon: true },
    { name: "WhatsApp", dot: "#25D366", comingSoon: true },
  ];

  return (
    <div>
      <SectionHeader title="Comptes connectés" />
      <p className="-mt-3 mb-4 text-[13px] text-muted">Connectez vos canaux pour publier et contacter vos leads depuis LogLead.</p>
      <div className="divide-y divide-line">
        {rows.map(({ name, dot, comingSoon }) => {
          const handle = state[name];
          return (
            <div key={name} className={`flex items-center justify-between gap-4 py-3.5 ${comingSoon ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
                <div>
                  <div className="text-[14px] font-medium text-ink">{name}</div>
                  <div className={`mt-0.5 text-[13px] ${handle ? "text-success" : "text-muted"}`}>
                    {comingSoon ? "Bientôt disponible" : handle ? `${handle} · Connecté` : "Non connecté"}
                  </div>
                </div>
              </div>
              {comingSoon ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Bientôt
                </span>
              ) : handle ? (
                <BtnGrey
                  onClick={async () => {
                    // LinkedIn: real disconnect (clears the stored OAuth token).
                    if (name === "LinkedIn") {
                      await fetch("/api/auth/linkedin/disconnect", { method: "POST" });
                      window.location.reload();
                      return;
                    }
                    setState((s) => ({ ...s, [name]: null }));
                  }}
                >
                  Déconnecter
                </BtnGrey>
              ) : (
                <BtnGrey
                  onClick={() => {
                    // LinkedIn: real OAuth flow (full-page redirect to consent).
                    if (name === "LinkedIn") {
                      window.location.href = "/api/auth/linkedin";
                      return;
                    }
                    setState((s) => ({ ...s, [name]: "Compte (démo)" }));
                    // Onboarding checklist trigger: first social network connected.
                    void fetch("/api/checklist", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ step: "connections" }),
                    });
                  }}
                >
                  Connecter
                </BtnGrey>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-muted">
        LinkedIn se connecte via OAuth officiel. LogLead agit en votre nom —
        déconnectable à tout moment.
      </p>

      <LinkedInLeadSource initialUrl={profileUrl} initialAuto={autoDetect} />
    </div>
  );
}

// Public LinkedIn profile URL — powers "détecter mes leads depuis LinkedIn"
// (scrapes who reacts/comments on your posts) + optional daily automation.
function LinkedInLeadSource({ initialUrl, initialAuto }: { initialUrl?: string; initialAuto?: boolean }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [auto, setAuto] = useState(Boolean(initialAuto));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/workspaces/linkedin-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), autoDetect: auto }),
      });
      const data = await res.json();
      setMsg(res.ok ? { ok: true, text: "Enregistré ✓" } : { ok: false, text: data.error ?? "Erreur" });
    } catch {
      setMsg({ ok: false, text: "Connexion impossible." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-line bg-surface p-4">
      <div className="text-[14px] font-semibold text-ink">Détection automatique de leads</div>
      <p className="mt-1 text-[13px] text-muted">
        Renseigne l&apos;URL de ton profil LinkedIn : LogLead détecte les personnes qui
        réagissent et commentent tes posts, et les importe comme leads.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/ton-profil"
          className="input flex-1"
        />
        <button onClick={save} disabled={saving} className="btn-primary shrink-0 disabled:opacity-60">
          {saving ? "…" : "Enregistrer"}
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-[13px] text-muted">
        <input
          type="checkbox"
          checked={auto}
          onChange={(e) => setAuto(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary,#0051FF)]"
        />
        <span>
          Détecter automatiquement — tous les jours (Growth/Pro), tous les 3 jours (Starter), une seule fois (Gratuit).{" "}
          <span className="text-faint">5 crédits par nouveau lead uniquement — 0 crédit s&apos;il n&apos;y a rien de neuf.</span>
        </span>
      </label>
      {msg && (
        <p className={`mt-2 text-[12px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>
      )}
    </div>
  );
}

// ---------- Équipe ------------------------------------------------------------------

function TeamTab({ plan, email, firstName }: { plan: Plan; email: string; firstName: string }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const locked = plan === "starter";
  const max = plan === "pro" ? 10 : 3;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[20px] font-medium text-ink">Membres du workspace</h2>
        {!locked && (
          <button onClick={() => setInviteOpen(true)} className="btn-primary !py-2 text-sm">
            + Inviter un membre
          </button>
        )}
      </div>
      <div className="mb-6 mt-3 border-t border-line" />

      {locked ? (
        <div className="rounded-[10px] border border-line px-6 py-10 text-center">
          <p className="text-[14px] font-medium text-ink">Disponible à partir du plan Growth</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
            Passez à l&apos;offre supérieure pour inviter des collaborateurs dans votre workspace.
          </p>
          <Link href="/pricing" className="btn-primary mt-4 inline-block !py-2 text-sm">Passer à Growth</Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-line">
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="text-[14px] font-medium text-ink">{firstName} (vous)</div>
                  <div className="text-[13px] text-muted">{email}</div>
                </div>
              </div>
              <span className="text-[12px] font-medium text-muted">Admin</span>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted">
            1/{max} membres · Plan {PLAN_META[plan].label}
          </p>
        </>
      )}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="modal-overlay absolute inset-0 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h3 className="font-display text-lg font-semibold text-ink">Inviter un membre</h3>
        {sent ? (
          <p className="mt-3 text-[13px] text-success">Invitation envoyée à {email} (démo).</p>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <div>
                <FieldLabel>Email</FieldLabel>
                <input className="input h-11 text-[13px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collaborateur@exemple.com" />
              </div>
              <div>
                <FieldLabel>Rôle</FieldLabel>
                <select className="input h-11 text-[13px]"><option>Membre</option><option>Admin</option></select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="btn-secondary !py-2 text-sm">Annuler</button>
              <button onClick={() => setSent(true)} disabled={!email} className="btn-primary !py-2 text-sm">Envoyer l&apos;invitation</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Facturation ------------------------------------------------------------------

// In-app plans grid — Monthly / Annual toggle, Stripe subscription on "Commencer".
function BillingPlans({ currentPlan }: { currentPlan: Plan }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState<Plan | null>(null);
  const price = (p: PlanCard) => (billing === "annual" ? Math.round(p.priceMonthly * 0.8) : p.priceMonthly);

  async function commencer(plan: Plan) {
    if (busy) return;
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
      const d = await res.json();
      if (res.ok && d.url) window.location.href = d.url;
      else setBusy(null);
    } catch {
      setBusy(null);
    }
  }

  return (
    <div className="mt-10">
      <SectionHeader title="Changer de plan" />
      <p className="-mt-3 mb-4 text-[13px] text-muted">Économisez 20% avec la facturation annuelle.</p>

      {/* Billing toggle (no quarterly) */}
      <div className="mb-6 inline-flex items-center rounded-full border border-line bg-surface-hover/50 p-1">
        {([["monthly", "Mensuel"], ["annual", "Annuel"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setBilling(v)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              billing === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {v === "annual" && (
              <span className="ml-1.5 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">-20%</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PLAN_CARDS.map((p) => {
          const isCurrent = currentPlan === p.id;
          const popular = p.popular;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-5 ${
                popular ? "border-primary shadow-[0_8px_30px_rgba(0,81,255,0.10)]" : "border-line"
              }`}
            >
              {popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Recommandé
                </span>
              )}
              <div className="text-[15px] font-semibold text-ink">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="num text-[28px] font-bold text-ink">€{price(p)}</span>
                <span className="text-[13px] text-muted">/mois</span>
              </div>
              {billing === "annual" && (
                <div className="mt-0.5 text-[11px] text-faint">facturé {price(p) * 12} € / an</div>
              )}

              <button
                onClick={() => !isCurrent && commencer(p.id)}
                disabled={isCurrent || busy !== null}
                className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-60 ${
                  isCurrent
                    ? "cursor-default border border-line text-muted"
                    : popular
                    ? "bg-primary text-white hover:opacity-90"
                    : "border border-line text-ink hover:bg-surface-hover"
                }`}
              >
                {busy === p.id ? "…" : isCurrent ? "Plan actuel" : "Commencer ↗"}
              </button>

              <div className="mt-4 border-t border-line pt-3 text-[12px] font-medium text-primary">
                {p.monthly.toLocaleString("fr-FR")} crédits / mois
              </div>
              <ul className="mt-2 flex-1 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12px] text-muted">
                    <span className="mt-0.5 shrink-0 text-primary">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FacturationTab({ plan, renewalDate }: { plan: Plan; renewalDate: string }) {
  const invoices = plan === "free" ? [] : [
    { date: "01/06/2026", desc: `LogLead ${PLAN_META[plan].label} — Mensuel`, amount: `${PLAN_META[plan].price.split(" ")[0]},00 €` },
    { date: "01/05/2026", desc: `LogLead ${PLAN_META[plan].label} — Mensuel`, amount: `${PLAN_META[plan].price.split(" ")[0]},00 €` },
  ];

  return (
    <div>
      <SectionHeader title="Votre abonnement" />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-line px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-ink">Plan {PLAN_META[plan].label}</span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {PLAN_META[plan].label}
            </span>
          </div>
          <div className="num mt-0.5 text-[13px] text-muted">
            {PLAN_META[plan].price}
            {plan !== "free" && ` · Renouvellement le ${renewalDate}`}
          </div>
        </div>
        {plan !== "free" && (
          <BtnGrey onClick={() => alert("Portail de facturation Stripe (démo).")}>Gérer l&apos;abonnement</BtnGrey>
        )}
      </div>

      {/* In-app plans grid (Stripe subscription checkout) */}
      <BillingPlans currentPlan={plan} />

      <SectionHeader title="Historique" className="mt-12" />
      {invoices.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Aucune facture pour l&apos;instant — votre historique apparaîtra ici après votre premier paiement.
        </p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-muted">
              <th className="py-2 font-normal">Date</th>
              <th className="py-2 font-normal">Description</th>
              <th className="py-2 font-normal">Montant</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invoices.map((inv) => (
              <tr key={inv.date}>
                <td className="num py-3 text-muted">{inv.date}</td>
                <td className="py-3 text-ink">{inv.desc}</td>
                <td className="num py-3 text-ink">{inv.amount}</td>
                <td className="py-3 text-right">
                  <button className="font-medium text-primary hover:underline">Télécharger</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
