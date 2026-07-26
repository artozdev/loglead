import { Link, Section, Text } from "@react-email/components";
import EmailLayout, { colors, Divider, styles } from "./_components/layout";

// Email 3 — daily brief from the CMO IA (Pro plan).
export default function DailyBriefEmail({
  firstName,
  dateLabel,
  items,
  geoScore,
  geoDelta,
  appUrl,
}: {
  firstName: string;
  dateLabel: string; // e.g. "samedi 11 juillet"
  items: { platform: string; time: string; title: string; id: string }[];
  geoScore: number | null;
  geoDelta: number | null;
  appUrl: string;
}) {
  return (
    <EmailLayout preview={`${firstName}, voici ton contenu du jour — ${dateLabel}`}>
      <Text style={styles.h1}>Ton contenu du jour</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>Voici tes publications prévues aujourd&apos;hui :</Text>
      {items.map((it) => (
        <Section key={it.id} style={{ padding: "6px 0" }}>
          <Text style={{ ...styles.text, margin: "0 0 2px", fontWeight: 600 }}>
            📱 {it.platform} — {it.time}
          </Text>
          <Text style={{ ...styles.muted, margin: "0 0 4px" }}>{it.title}</Text>
          <Link
            href={`${appUrl}/calendar`}
            style={{ color: colors.primary, fontSize: "13px", fontWeight: 600 }}
          >
            Voir et valider →
          </Link>
        </Section>
      ))}
      {geoScore !== null && (
        <>
          <Divider />
          <Text style={styles.muted}>
            Score GEO ce mois-ci : <strong style={{ color: colors.ink }}>{geoScore}/100</strong>
            {geoDelta ? ` ${geoDelta > 0 ? "↑ +" : "↓ "}${geoDelta} pts` : ""}
          </Text>
        </>
      )}
      <Text style={{ ...styles.muted, marginBottom: 0 }}>
        Bonne journée,
        <br />
        Ton CMO IA LogLead
      </Text>
    </EmailLayout>
  );
}
