import ComingSoon from "./ComingSoon";

const FEATURES = [
  "Liste centralisée de tous tes prospects par canal (LinkedIn, X, Instagram, Reddit, Site)",
  "Coordonnées : email, téléphone, profil LinkedIn",
  "Canal d'acquisition + contenu source qui a généré le lead",
  "Statuts : Nouveau / Contacté / En discussion / Converti",
  "Enrichissement IA des profils (plan Pro)",
  "Message de premier contact généré par le CMO IA",
];

export default function LeadsComingSoon({
  email,
  alreadySubscribed,
}: {
  email: string;
  alreadySubscribed: boolean;
}) {
  return (
    <ComingSoon
      feature="leads"
      email={email}
      alreadySubscribed={alreadySubscribed}
      title="Vos leads arrivent bientôt"
      subtitle="Bientôt vous pourrez centraliser tous vos prospects générés depuis LinkedIn, X, Instagram et Reddit en un seul endroit — avec leur canal d'acquisition, leurs coordonnées et leur historique d'interactions."
      progress={45}
      illustration={<LeadsArt />}
      features={FEATURES}
      preview={
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card text-left">
            <div className="text-sm font-medium text-muted">Prospects captés ce mois</div>
            <div className="num mt-2 font-display text-2xl font-semibold tracking-tight text-ink">—</div>
          </div>
          <div className="card text-left">
            <div className="text-sm font-medium text-muted">Meilleur canal d&apos;acquisition</div>
            <div className="mt-2">
              <span className="chip border-line" style={{ backgroundColor: "var(--color-linkedin-bg)", color: "var(--color-linkedin)" }}>
                LinkedIn
              </span>
            </div>
          </div>
          <div className="card text-left">
            <div className="text-sm font-medium text-muted">Leads convertis</div>
            <div className="num mt-2 font-display text-2xl font-semibold tracking-tight text-ink">—%</div>
          </div>
          <div className="card text-left">
            <div className="mb-2 text-sm font-medium text-muted">Derniers leads</div>
            <ul className="space-y-2">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-brand-gradient opacity-80" />
                  <span className="h-2.5 flex-1 rounded-full bg-surface-hover" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
    />
  );
}

function LeadsArt() {
  const badge = (
    x: number,
    y: number,
    label: string,
    bg: string,
    fg: string,
  ) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width="36" height="22" rx="7" style={{ fill: `var(${bg})`, stroke: `var(${fg})` }} strokeWidth="1.5" />
      <text x="18" y="15" textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: `var(${fg})` }}>
        {label}
      </text>
    </g>
  );

  return (
    <svg
      viewBox="0 0 240 160"
      className="h-[210px] w-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Liste de prospects en préparation"
    >
      {/* Contact list panel */}
      <rect x="60" y="30" width="120" height="100" rx="12" style={{ fill: "var(--bg-surface)", stroke: "var(--border)" }} strokeWidth="2" />
      {/* Header bar */}
      <rect x="72" y="42" width="52" height="6" rx="3" style={{ fill: "var(--border-strong)" }} />

      {/* Contact rows */}
      {[
        { y: 62, c: "var(--color-linkedin)" },
        { y: 84, c: "var(--color-instagram)" },
        { y: 106, c: "#0051FF" },
      ].map((row, i) => (
        <g key={i}>
          <circle cx="80" cy={row.y + 6} r="8" style={{ fill: row.c }} opacity="0.85" />
          <rect x="96" y={row.y} width="60" height="5" rx="2.5" style={{ fill: "var(--text-muted)" }} opacity="0.7" />
          <rect x="96" y={row.y + 9} width="40" height="4" rx="2" style={{ fill: "var(--border-strong)" }} />
        </g>
      ))}

      {/* Floating platform badges */}
      {badge(24, 26, "in", "--color-linkedin-bg", "--color-linkedin")}
      {badge(182, 20, "X", "--color-x-bg", "--color-x")}
      {badge(18, 104, "IG", "--color-instagram-bg", "--color-instagram")}
      {badge(186, 110, "r/", "--color-reddit-bg", "--color-reddit")}

      {/* Connector dots */}
      <circle cx="62" cy="42" r="2.5" fill="#0085FF" />
      <circle cx="178" cy="40" r="2.5" fill="#0085FF" />
      <circle cx="64" cy="116" r="2.5" fill="#0085FF" />
    </svg>
  );
}
