import ComingSoon from "./ComingSoon";

const PREVIEW = [
  { label: "Vues totales", value: "128,4 k", delta: "+18 %", tone: "text-success" },
  { label: "Taux d'engagement", value: "6,2 %", delta: "+2,1 pts", tone: "text-success" },
  { label: "Meilleur canal", value: "LinkedIn", delta: "42 % des vues", tone: "text-muted" },
  { label: "Croissance abonnés", value: "+1 240", delta: "+9 %", tone: "text-success" },
];

export default function AnalyticsComingSoon({
  email,
  alreadySubscribed,
}: {
  email: string;
  alreadySubscribed: boolean;
}) {
  return (
    <ComingSoon
      feature="analytics"
      email={email}
      alreadySubscribed={alreadySubscribed}
      title="Analytics arrive bientôt"
      subtitle="On construit quelque chose de puissant. Bientôt tu pourras voir toutes tes métriques LinkedIn, X, Instagram et Reddit en un seul endroit."
      progress={67}
      illustration={<AnalyticsArt />}
      preview={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PREVIEW.map((p) => (
            <div key={p.label} className="card text-left">
              <div className="text-sm font-medium text-muted">{p.label}</div>
              <div className="num mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                {p.value}
              </div>
              <div className={`num mt-1 text-xs font-semibold ${p.tone}`}>{p.delta}</div>
            </div>
          ))}
        </div>
      }
    />
  );
}

function AnalyticsArt() {
  return (
    <svg
      viewBox="0 0 240 160"
      className="h-[200px] w-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tableau de bord en construction"
    >
      {/* Panel */}
      <rect x="24" y="20" width="192" height="120" rx="12" style={{ fill: "var(--bg-surface)", stroke: "var(--border)" }} strokeWidth="2" />
      <rect x="24" y="20" width="192" height="26" rx="12" style={{ fill: "var(--bg-surface-hover)" }} />
      <circle cx="40" cy="33" r="3" style={{ fill: "var(--border-strong)" }} />
      <circle cx="52" cy="33" r="3" style={{ fill: "var(--border-strong)" }} />
      <circle cx="64" cy="33" r="3" style={{ fill: "var(--border-strong)" }} />

      {/* Bars growing */}
      <rect x="44" y="96" width="20" height="28" rx="4" fill="#0085FF" opacity="0.35" />
      <rect x="76" y="80" width="20" height="44" rx="4" fill="#0085FF" opacity="0.55" />
      <rect x="108" y="64" width="20" height="60" rx="4" fill="#0051FF" opacity="0.75" />
      <rect x="140" y="88" width="20" height="36" rx="4" fill="#0085FF" opacity="0.45" />

      {/* Trend line */}
      <path d="M50 92 L86 78 L118 60 L150 72 L186 52" stroke="#0051FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="186" cy="52" r="4" fill="#0051FF" />

      {/* Build accent */}
      <g transform="translate(168 96)">
        <rect x="-4" y="14" width="40" height="6" rx="3" fill="#F59E0B" />
        <path d="M2 14a14 14 0 0 1 28 0z" fill="#F59E0B" />
        <rect x="13" y="2" width="6" height="6" rx="2" fill="#FBBF24" />
      </g>
    </svg>
  );
}
