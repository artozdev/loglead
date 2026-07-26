import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { styles } from "./_components/layout";

// Email 5 — trial just ended, account is read-only.
export default function TrialEndedEmail({
  firstName,
  appUrl,
}: {
  firstName: string;
  appUrl: string;
}) {
  return (
    <EmailLayout preview="Ton essai LogLead vient de se terminer">
      <Text style={styles.h1}>Ton essai vient de se terminer</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>Ton essai gratuit de 14 jours vient de se terminer.</Text>
      <Text style={styles.text}>
        Ton compte est maintenant en lecture seule. Tes données sont conservées pendant
        30 jours.
      </Text>
      <Text style={styles.text}>
        Pour reprendre là où tu t&apos;es arrêté et continuer à transformer ton SaaS en
        machine à leads :
      </Text>
      <Section style={{ padding: "4px 0 20px" }}>
        <CtaButton href={`${appUrl}/pricing`}>Réactiver mon compte →</CtaButton>
      </Section>
      <Text style={styles.muted}>
        Plan Growth à 59€/mois — 14 jours de plus offerts si tu t&apos;abonnes dans les 48
        prochaines heures.
      </Text>
      <Text style={{ ...styles.muted, marginBottom: 0 }}>— Arthur</Text>
    </EmailLayout>
  );
}
