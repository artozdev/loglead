import { Link, Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { colors, Divider, styles } from "./_components/layout";

// Email 8 — Monday-morning weekly recap.
export default function WeeklySummaryEmail({
  firstName,
  saasName,
  weekLabel,
  stats,
  bestContent,
  recommendation,
  appUrl,
}: {
  firstName: string;
  saasName: string;
  weekLabel: string; // e.g. "6 – 12 juillet"
  stats: { generated: number; published: number; avgScore: number; geoScore: number | null; geoDelta: number | null };
  bestContent: { title: string; id: string } | null;
  recommendation: string;
  appUrl: string;
}) {
  const row = (label: string, value: string) => (
    <tr>
      <td style={{ padding: "4px 24px 4px 0", fontSize: "13px", color: colors.muted }}>{label}</td>
      <td style={{ padding: "4px 0", fontSize: "13px", color: colors.ink, fontWeight: 600 }}>{value}</td>
    </tr>
  );

  return (
    <EmailLayout preview={`Tes stats LogLead de la semaine — ${weekLabel}`}>
      <Text style={styles.h1}>Ton bilan de la semaine</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>
        Voici ton bilan de la semaine pour <strong>{saasName}</strong> :
      </Text>
      <Text style={{ ...styles.text, margin: "0 0 4px", fontWeight: 600 }}>📊 Cette semaine</Text>
      <table role="presentation" style={{ margin: "0 0 8px" }}>
        <tbody>
          {row("Contenus générés", String(stats.generated))}
          {row("Contenus publiés", String(stats.published))}
          {row("Score moyen", `${stats.avgScore}/100`)}
          {stats.geoScore !== null
            ? row(
                "Score GEO",
                `${stats.geoScore}/100${stats.geoDelta ? ` ${stats.geoDelta > 0 ? "↑ +" : "↓ "}${stats.geoDelta} pts` : ""}`,
              )
            : null}
        </tbody>
      </table>
      {bestContent && (
        <>
          <Divider />
          <Text style={{ ...styles.text, margin: "0 0 4px", fontWeight: 600 }}>🔥 Ton meilleur contenu</Text>
          <Text style={{ ...styles.muted, margin: "0 0 6px" }}>{bestContent.title}</Text>
          <Link
            href={`${appUrl}/studio?content=${bestContent.id}`}
            style={{ color: colors.primary, fontSize: "13px", fontWeight: 600 }}
          >
            Voir le contenu →
          </Link>
        </>
      )}
      <Divider />
      <Text style={{ ...styles.text, margin: "0 0 4px", fontWeight: 600 }}>💡 Recommandation de la semaine</Text>
      <Text style={styles.muted}>{recommendation}</Text>
      <Section style={{ padding: "8px 0 4px" }}>
        <CtaButton href={`${appUrl}/dashboard`}>Aller sur LogLead →</CtaButton>
      </Section>
      <Text style={{ ...styles.muted, marginTop: "16px", marginBottom: 0 }}>
        Bonne semaine,
        <br />
        L&apos;équipe LogLead
      </Text>
    </EmailLayout>
  );
}
