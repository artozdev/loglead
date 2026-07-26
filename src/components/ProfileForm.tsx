"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ALGO_NETWORKS,
  GOALS,
  INSTAGRAM_SOON_TOOLTIP,
  SECTORS,
  TONES,
  type AlgoNetwork,
  type Goal,
  type Platform,
  type Profile,
  type Tone,
} from "@/lib/types";

type Props = {
  initial?: Profile | null;
  onDirtyChange?: (dirty: boolean) => void;
};

const OBJECTIVES: Goal[] = ["notoriety", "leads", "both"];
const NETWORK_TO_PLATFORM: Partial<Record<AlgoNetwork, Platform>> = {
  linkedin: "linkedin",
  instagram: "instagram",
};
function derivePlatforms(networks: AlgoNetwork[]): Platform[] {
  const ps = [...new Set(networks.map((n) => NETWORK_TO_PLATFORM[n]).filter(Boolean) as Platform[])];
  return ps.length ? ps : ["linkedin"];
}
function initialNetworks(p?: Profile | null): AlgoNetwork[] {
  if (p?.networks?.length) return p.networks;
  const fromPlatforms = (p?.platforms ?? [])
    .map((pl) => (pl === "linkedin" ? "linkedin" : pl === "instagram" ? "instagram" : null))
    .filter(Boolean) as AlgoNetwork[];
  return fromPlatforms.length ? fromPlatforms : ["linkedin"];
}

export default function ProfileForm({ initial, onDirtyChange }: Props) {
  const router = useRouter();
  const [saasName, setSaasName] = useState(initial?.saasName ?? "");
  const [siteUrl, setSiteUrl] = useState(initial?.siteUrl ?? "");
  const [offer, setOffer] = useState(initial?.offer ?? "");
  const [valueProp, setValueProp] = useState(initial?.valueProp ?? "");
  const [icp, setIcp] = useState(initial?.icp ?? "");
  const [niche, setNiche] = useState(initial?.sector ?? "");
  const [competitors, setCompetitors] = useState<string[]>([
    initial?.competitors[0] ?? "",
    initial?.competitors[1] ?? "",
    initial?.competitors[2] ?? "",
  ]);
  const [tone, setTone] = useState<Tone>(initial?.tone ?? "expert");
  const [networks, setNetworks] = useState<AlgoNetwork[]>(initialNetworks(initial));
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? "leads");

  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  function touch() {
    if (!dirty) setDirty(true);
    if (success) setSuccess(false);
  }
  function toggleNetwork(n: AlgoNetwork) {
    touch();
    setNetworks((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  async function reanalyze() {
    if (!siteUrl.trim()) return;
    setReanalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });
      const out = await res.json();
      if (out.ok && out.fields) {
        touch();
        setSaasName(out.fields.name ?? saasName);
        setOffer(out.fields.description ?? offer);
        setValueProp(out.fields.valueProp ?? valueProp);
        setIcp(out.fields.icp ?? icp);
      } else {
        setError("Analyse impossible pour cette URL.");
      }
    } catch {
      setError("Analyse impossible. Réessaie.");
    } finally {
      setReanalyzing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!networks.length) {
      setError("Choisis au moins un réseau.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saasName,
          offer,
          valueProp,
          icp,
          sector: niche,
          siteUrl,
          competitors,
          tone,
          platforms: derivePlatforms(networks),
          networks,
          goal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      setDirty(false);
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Enregistrement impossible. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SettingsSection
        title="Profil de votre SaaS"
        subtitle="Ces informations personnalisent toutes vos recommandations et contenus générés."
      >
        <Field label="Nom du SaaS" value={saasName} onChange={(v) => { touch(); setSaasName(v); }} placeholder="ex. LogLead" />

        <div>
          <label className="label" htmlFor="siteUrl">URL du site</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="siteUrl"
              className="input flex-1"
              value={siteUrl}
              onChange={(e) => { touch(); setSiteUrl(e.target.value); }}
              placeholder="https://flowmetrics.io"
            />
            <button type="button" onClick={reanalyze} disabled={reanalyzing || !siteUrl.trim()} className="btn-secondary shrink-0">
              {reanalyzing ? "Analyse…" : "Réanalyser"}
            </button>
          </div>
        </div>

        <Field label="Description de l'offre" value={offer} onChange={(v) => { touch(); setOffer(v); }} textarea placeholder="2-3 phrases qui décrivent ce que fait ton SaaS." />
        <Field label="Proposition de valeur" value={valueProp} onChange={(v) => { touch(); setValueProp(v); }} placeholder="ex. Comprendre tes utilisateurs sans data analyst" />
        <Field label="Audience cible (ICP)" value={icp} onChange={(v) => { touch(); setIcp(v); }} placeholder="ex. Founders SaaS B2B" />

        <div>
          <label className="label" htmlFor="niche">Niche</label>
          <input
            id="niche"
            className="input"
            value={niche}
            onChange={(e) => { touch(); setNiche(e.target.value); }}
            placeholder="ex. SaaS B2B / Productivité"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { touch(); setNiche(s); }}
                className={`chip cursor-pointer ${niche === s ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Concurrents (jusqu'à 3)</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {competitors.map((c, i) => (
              <input
                key={i}
                className="input"
                value={c}
                onChange={(e) => { touch(); setCompetitors((prev) => prev.map((x, j) => (j === i ? e.target.value : x))); }}
                placeholder={`Concurrent ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Style & diffusion">
        <div>
          <span className="label">Ton de voix</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {TONES.map((t) => (
              <Card key={t.value} selected={tone === t.value} onClick={() => { touch(); setTone(t.value); }} title={t.label} hint={t.hint} />
            ))}
          </div>
        </div>

        <div>
          <span className="label">Plateformes prioritaires</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALGO_NETWORKS.map((n) => {
              const on = networks.includes(n.value);
              if (n.comingSoon) {
                return (
                  <div
                    key={n.value}
                    title={INSTAGRAM_SOON_TOOLTIP}
                    aria-disabled="true"
                    className="relative flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-ink/70 opacity-40"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.dot }} />
                    {n.label}
                    <span className="absolute -right-1.5 -top-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                      Bientôt
                    </span>
                  </div>
                );
              }
              return (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => toggleNetwork(n.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${on ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-line text-ink/70 hover:border-gray-300"}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.dot }} />
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="label">Objectif principal</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {GOALS.filter((g) => OBJECTIVES.includes(g.value)).map((g) => (
              <Card key={g.value} selected={goal === g.value} onClick={() => { touch(); setGoal(g.value); }} title={`${g.emoji} ${g.label}`} hint={g.hint} />
            ))}
          </div>
        </div>
      </SettingsSection>

      {error && <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
      {success && (
        <p className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success">
          Profil mis à jour. Les nouvelles recommandations seront disponibles sous 24h.
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-muted">Modifications non enregistrées</span>}
        <button type="submit" disabled={saving || !dirty} className="btn-primary">
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

function SettingsSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea rows={2} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function Card({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-4 py-3 text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-line hover:border-gray-300"}`}
    >
      <div className={`text-sm font-semibold ${selected ? "text-primary" : "text-ink"}`}>{title}</div>
      <div className="text-xs text-muted">{hint}</div>
    </button>
  );
}
