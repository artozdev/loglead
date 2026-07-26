"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import {
  ALGO_NETWORKS,
  GOALS,
  INSTAGRAM_SOON_TOOLTIP,
  ORG_TYPES,
  SECTORS,
  TONES,
  V1_NETWORKS,
  type AlgoNetwork,
  type Goal,
  type OrgType,
  type Platform,
  type Tone,
} from "@/lib/types";
import { useLocale } from "./LocaleProvider";

export type WizardData = {
  siteUrl?: string;
  saasName?: string;
  offer?: string;
  valueProp?: string;
  icp?: string;
  orgType?: OrgType;
  sector?: string; // la niche
  tone?: Tone;
  networks?: AlgoNetwork[];
  goal?: Goal;
};

const TOTAL = 4;
const DONE = TOTAL + 1; // final screen
const LOADER_MESSAGES = [
  "Lecture de ta page…",
  "Identification de ton offre…",
  "Analyse de ton positionnement…",
];

// The 4 distribution networks map onto the content-format platforms where a
// format exists (X / Reddit have no native content type yet).
const NETWORK_TO_PLATFORM: Partial<Record<AlgoNetwork, Platform>> = {
  linkedin: "linkedin",
  instagram: "instagram",
};
function derivePlatforms(networks: AlgoNetwork[]): Platform[] {
  const ps = [...new Set(networks.map((n) => NETWORK_TO_PLATFORM[n]).filter(Boolean) as Platform[])];
  return ps.length ? ps : ["linkedin"];
}

export default function OnboardingWizard({
  initialStep,
  initialData,
}: {
  initialStep: number;
  initialData: WizardData;
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), TOTAL));
  // The 3 V1 networks are pre-selected by default.
  const [data, setData] = useState<WizardData>({ networks: [...V1_NETWORKS], ...initialData });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));

  async function saveProgress(toStep: number, payload: WizardData) {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: toStep, data: payload }),
      });
    } catch {
      /* autosave is best-effort */
    }
  }

  function validate(): string | null {
    if (step === 1) {
      if (!data.saasName?.trim() || !data.offer?.trim() || !data.valueProp?.trim() || !data.icp?.trim())
        return "Analyse ton site ou remplis le nom, l'offre, la proposition de valeur et l'audience cible.";
    }
    if (step === 2 && !data.sector?.trim()) return "Indique ta niche.";
    if (step === 3) {
      if (!data.networks?.length) return "Choisis au moins un réseau.";
      if (!data.goal) return "Choisis ton objectif principal.";
    }
    if (step === 4 && !data.tone) return "Choisis un ton de voix.";
    return null;
  }

  async function next() {
    const err = validate();
    if (err) return setError(err);
    setError(null);

    if (step < TOTAL) {
      const toStep = step + 1;
      setSaving(true);
      await saveProgress(toStep, data);
      setSaving(false);
      setStep(toStep);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(data)),
      });
      const out = await res.json();
      if (!res.ok) {
        setError(out.error ?? "Impossible de finaliser.");
        return;
      }
      setStep(DONE);
    } finally {
      setSaving(false);
    }
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  if (step === DONE)
    return <FinalScreen data={data} onGo={() => { router.push("/algo-insider"); router.refresh(); }} />;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span className="num">Étape {step} sur {TOTAL}</span>
          <span className="num">{Math.round((step / TOTAL) * 100)} %</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand-gradient transition-[width] duration-300 ease-smooth"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        {step === 1 && <Step1 data={data} set={set} />}
        {step === 2 && <Step2 data={data} set={set} />}
        {step === 3 && <Step3 data={data} set={set} />}
        {step === 4 && <Step4 data={data} set={set} />}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button onClick={back} className="btn-secondary">Retour</button>
        ) : (
          <span />
        )}
        <button onClick={next} disabled={saving} className="btn-primary">
          {saving ? "…" : step === TOTAL ? "Créer mon espace" : "Continuer"}
        </button>
      </div>
    </div>
  );
}

function toPayload(d: WizardData) {
  const networks = d.networks ?? [];
  return {
    saasName: d.saasName ?? "",
    offer: d.offer ?? "",
    valueProp: d.valueProp ?? "",
    icp: d.icp ?? "",
    competitors: [],
    competitorDiffs: [],
    tone: d.tone,
    platforms: derivePlatforms(networks),
    networks,
    goal: d.goal,
    orgType: d.orgType,
    siteUrl: d.siteUrl ?? "",
    sector: d.sector ?? "",
    companySizes: [],
    problem: "",
  };
}

// ---------- Shared bits ----------

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
    </div>
  );
}

type StepProps = { data: WizardData; set: (p: Partial<WizardData>) => void };

// ---------- Step 1 — Ton SaaS ----------

function Step1({ data, set }: StepProps) {
  const [view, setView] = useState<"url" | "summary" | "manual">(data.saasName ? "summary" : "url");
  const [url, setUrl] = useState(data.siteUrl ?? "");
  const [analyzing, setAnalyzing] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [demo, setDemo] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (analyzing) {
      timer.current = setInterval(() => setMsgIndex((i) => (i + 1) % LOADER_MESSAGES.length), 1400);
    } else if (timer.current) {
      clearInterval(timer.current);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [analyzing]);

  async function analyze() {
    if (!url.trim()) return;
    setAnalyzing(true);
    setMsgIndex(0);
    try {
      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const out = await res.json();
      if (out.ok && out.fields) {
        set({
          siteUrl: out.url ?? url,
          saasName: out.fields.name,
          offer: out.fields.description,
          valueProp: out.fields.valueProp,
          icp: data.icp || out.fields.icp,
          tone: data.tone || out.fields.tone,
        });
        setDemo(Boolean(out.demo));
        setView("summary");
      } else {
        setView("manual");
      }
    } catch {
      setView("manual");
    } finally {
      setAnalyzing(false);
    }
  }

  if (view === "url") {
    return (
      <div>
        <Heading
          title="Parle-nous de ton SaaS"
          subtitle="Colle l'URL de ton site ou de ta page de vente — on s'occupe du reste."
        />
        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="url">URL du site</label>
            <input
              id="url"
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ex. https://flowmetrics.io"
              onKeyDown={(e) => e.key === "Enter" && analyze()}
            />
          </div>
          {analyzing ? (
            <div className="flex items-center gap-3 rounded-lg bg-primary/[0.05] px-3 py-3 text-sm text-primary">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              {LOADER_MESSAGES[msgIndex]}
            </div>
          ) : (
            <button onClick={analyze} className="btn-primary w-full">Analyser mon SaaS</button>
          )}
          <button
            onClick={() => setView("manual")}
            className="block w-full text-center text-xs text-muted hover:text-ink"
          >
            Pas de site ? Saisis les infos à la main
          </button>
        </div>
      </div>
    );
  }

  if (view === "manual") {
    return (
      <div>
        <Heading title="Parle-nous de ton SaaS" subtitle="Quelques infos suffisent pour démarrer." />
        <div className="card space-y-4">
          <Field label="Nom du SaaS" value={data.saasName ?? ""} onChange={(v) => set({ saasName: v })} placeholder="ex. FlowMetrics" />
          <Field label="Décris ton offre en 2-3 phrases" value={data.offer ?? ""} onChange={(v) => set({ offer: v })} textarea placeholder="ex. Un outil d'analytics produit no-code…" />
          <Field label="Ta proposition de valeur" value={data.valueProp ?? ""} onChange={(v) => set({ valueProp: v })} placeholder="ex. Comprendre tes utilisateurs sans data analyst" />
          <Field label="Audience cible (ICP)" value={data.icp ?? ""} onChange={(v) => set({ icp: v })} placeholder="ex. Founders SaaS B2B" />
        </div>
      </div>
    );
  }

  // summary (editable)
  return (
    <div>
      <Heading title="Voici ce qu'on a compris" subtitle="Corrige ce qui n'est pas exact avant de continuer." />
      {demo && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
          Analyse de démonstration. Ajoute une clé Claude pour une extraction réelle.
        </p>
      )}
      <div className="card space-y-4">
        <Field label="Nom du SaaS" value={data.saasName ?? ""} onChange={(v) => set({ saasName: v })} editable />
        <Field label="Offre" value={data.offer ?? ""} onChange={(v) => set({ offer: v })} textarea editable />
        <Field label="Proposition de valeur" value={data.valueProp ?? ""} onChange={(v) => set({ valueProp: v })} editable />
        <Field label="Audience cible (ICP)" value={data.icp ?? ""} onChange={(v) => set({ icp: v })} editable />
        <button onClick={() => setView("url")} className="text-xs text-muted hover:text-ink">
          ↺ Analyser une autre URL
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
  editable,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
  editable?: boolean;
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {label}
        {editable && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </label>
      {textarea ? (
        <textarea rows={2} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

// ---------- Step 2 — Ta niche ----------

function Step2({ data, set }: StepProps) {
  const { t } = useLocale();
  return (
    <div>
      <Heading
        title="Quelle est ta niche ?"
        subtitle="Elle guide toutes tes recommandations. On l'a pré-remplie depuis ton site — affine-la si besoin."
      />
      <div className="card space-y-4">
        <div>
          <span className="label">{t("onboarding.orgType.q")}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {ORG_TYPES.map((o) => {
              const on = data.orgType === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set({ orgType: o.value })}
                  className={`flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-left text-[13px] transition ${
                    on ? "border-primary bg-primary/[0.06] font-medium text-ink" : "border-line text-muted hover:bg-surface-hover"
                  }`}
                >
                  <span className="text-base">{o.emoji}</span>
                  {t(o.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="niche">Ta niche</label>
          <input
            id="niche"
            className="input"
            value={data.sector ?? ""}
            onChange={(e) => set({ sector: e.target.value })}
            placeholder="ex. SaaS B2B / Productivité, App mobile / Fitness, SaaS RH / PME…"
          />
        </div>
        <div>
          <span className="label">Suggestions</span>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set({ sector: s })}
                className={`chip cursor-pointer ${data.sector === s ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Step 3 — Réseaux + objectif ----------

const OBJECTIVE_VALUES: Goal[] = ["notoriety", "leads", "both"];

function Step3({ data, set }: StepProps) {
  const networks = data.networks ?? [];
  const objectives = GOALS.filter((g) => OBJECTIVE_VALUES.includes(g.value));
  return (
    <div>
      <Heading
        title="Où veux-tu être présent ?"
        subtitle="Choisis tes réseaux et ton objectif principal — on adapte les recommandations et les CTA."
      />
      <div className="space-y-6">
        <div>
          <span className="label">Réseaux prioritaires</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALGO_NETWORKS.map((n) => {
              const on = networks.includes(n.value);
              if (n.comingSoon) {
                return (
                  <div
                    key={n.value}
                    title={INSTAGRAM_SOON_TOOLTIP}
                    aria-disabled="true"
                    className="relative flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-line px-3 py-3 opacity-40"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: n.dot }} />
                    <span className="text-xs font-medium text-ink/70">{n.label}</span>
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
                  onClick={() =>
                    set({
                      networks: on ? networks.filter((x) => x !== n.value) : [...networks, n.value],
                    })
                  }
                  className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 transition ${on ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-line hover:border-gray-300"}`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: n.dot }} />
                  <span className={`text-xs font-medium ${on ? "text-primary" : "text-ink/70"}`}>{n.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            LogLead est optimisé pour LinkedIn, X et Reddit en V1 — les 3 canaux qui génèrent le
            plus de leads et de visibilité pour un SaaS founder. Instagram arrive très
            prochainement.
          </p>
        </div>

        <div>
          <span className="label">Objectif principal</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {objectives.map((g) => (
              <SelectCard
                key={g.value}
                selected={data.goal === g.value}
                onClick={() => set({ goal: g.value })}
                title={`${g.emoji} ${g.label}`}
                hint={g.hint}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Step 4 — Ton style ----------

function Step4({ data, set }: StepProps) {
  return (
    <div>
      <Heading title="Quel est ton style de communication ?" subtitle="Le ton de voix de tout ton contenu généré." />
      <div className="grid gap-2 sm:grid-cols-2">
        {TONES.map((t) => (
          <SelectCard
            key={t.value}
            selected={data.tone === t.value}
            onClick={() => set({ tone: t.value })}
            title={t.label}
            hint={t.hint}
          />
        ))}
      </div>
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  title,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
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

// ---------- Final screen ----------

function FinalScreen({ data, onGo }: { data: WizardData; onGo: () => void }) {
  const networks = (data.networks ?? [])
    .map((n) => ALGO_NETWORKS.find((x) => x.value === n)?.label)
    .filter(Boolean)
    .join(", ");
  const goal = GOALS.find((g) => g.value === data.goal);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-white">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ton espace LogLead est prêt 🚀</h1>
      <div className="mt-4 space-y-1 text-sm text-muted">
        <p><span className="text-ink">SaaS :</span> {data.saasName}</p>
        <p><span className="text-ink">Niche :</span> {data.sector || "—"}</p>
        <p><span className="text-ink">Réseaux :</span> {networks || "—"}</p>
        <p><span className="text-ink">Objectif :</span> {goal ? `${goal.emoji} ${goal.label}` : "—"}</p>
      </div>
      <button onClick={onGo} className="btn-primary mt-8">Découvrir mon Algo Insider</button>
      <span className="mt-4"><Logo size={24} /></span>
    </div>
  );
}
