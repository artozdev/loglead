import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { colors, styles } from "./_components/layout";

// Email 4 — trial ends in 3 days.
export default function TrialEndingEmail({
  firstName,
  stats,
  appUrl,
}: {
  firstName: string;
  stats: { generated: number; analyses: number; geoScore: number | null };
  appUrl: string;
}) {
  return (
    <EmailLayout preview="Il te reste 3 jours d'essai — ne perds pas ta progression">
      <Text style={styles.h1}>Il te reste 3 jours d&apos;essai</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>Ton essai gratuit LogLead se termine dans 3 jours.</Text>
      <Text style={{ ...styles.text, margin: "0 0 4px", fontWeight: 600 }}>
        Ce que tu as accompli jusqu&apos;ici :
      </Text>
      <Text style={{ ...styles.text, margin: "0 0 16px" }}>
        ✅ {stats.generated} contenus générés
        <br />✅ {stats.analyses} analyses effectuées
        {stats.geoScore !== null && (
          <>
            <br />✅ Score GEO : {stats.geoScore}/100
          </>
        )}
      </Text>
      <Text style={styles.text}>
        Pour continuer à utiliser LogLead et ne pas perdre tes données, choisis ton plan
        dès maintenant.
      </Text>
      <Section style={{ padding: "4px 0 20px" }}>
        <CtaButton href={`${appUrl}/pricing`}>Choisir mon plan →</CtaButton>
      </Section>
      <Text style={styles.muted}>
        Sans action de ta part, ton compte passera en lecture seule à la fin de
        l&apos;essai. Tes données sont conservées 30 jours.
      </Text>
      <Text style={styles.muted}>— Arthur, fondateur de LogLead</Text>
      <Text style={{ ...styles.muted, marginBottom: 0, color: colors.faint }}>
        P.S. Des questions ? Réponds directement à cet email.
      </Text>
    </EmailLayout>
  );
}
