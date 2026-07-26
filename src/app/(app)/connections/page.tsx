import { requireProfile } from "@/lib/guards";

const SOCIAL = [
  { name: "LinkedIn", desc: "Publie tes posts et suis tes performances." },
  { name: "Instagram", desc: "Programme Reels, stories et légendes." },
  { name: "TikTok", desc: "Pousse tes scripts vidéo au bon moment." },
];

const AUTOMATION = [
  { name: "Buffer", desc: "File d'attente de publication multi-réseaux." },
  { name: "Zapier", desc: "Connecte LogLead à 6 000+ outils." },
  { name: "Make", desc: "Automatise tes workflows de publication." },
];

function ConnectionCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] font-display text-sm font-bold text-primary">
          {name.charAt(0)}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-ink">{name}</div>
          <span className="chip border-line text-muted">Non connecté</span>
        </div>
      </div>
      <p className="flex-1 text-sm text-muted">{desc}</p>
      <button
        type="button"
        disabled
        title="Bientôt disponible"
        className="btn-secondary w-full cursor-not-allowed opacity-70"
      >
        Connecter · bientôt
      </button>
    </div>
  );
}

export default async function ConnectionsPage() {
  await requireProfile();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Comptes connectés
        </h1>
        <p className="mt-1 text-muted">
          Connecte tes réseaux et tes outils pour publier automatiquement le
          contenu que tu génères. La connexion en un clic arrive bientôt — en
          attendant, exporte ton calendrier en CSV / .ics.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Réseaux sociaux
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL.map((s) => (
            <ConnectionCard key={s.name} {...s} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Automatisation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUTOMATION.map((a) => (
            <ConnectionCard key={a.name} {...a} />
          ))}
        </div>
      </section>
    </div>
  );
}
