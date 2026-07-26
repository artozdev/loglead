import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { styles } from "./_components/layout";

// Email 10 — subscription cancelled.
export default function CancellationEmail({
  firstName,
  periodEndDate,
  appUrl,
}: {
  firstName: string;
  periodEndDate: string;
  appUrl: string;
}) {
  return (
    <EmailLayout preview="Ton abonnement LogLead a été résilié">
      <Text style={styles.h1}>Abonnement résilié</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>Ton abonnement LogLead a bien été résilié.</Text>
      <Text style={styles.text}>
        Tu gardes l&apos;accès à toutes les fonctionnalités jusqu&apos;au{" "}
        <strong>{periodEndDate}</strong>.
      </Text>
      <Text style={styles.muted}>
        Tes données sont conservées pendant 30 jours après cette date.
      </Text>
      <Text style={styles.text}>Si tu as résilié par erreur ou si tu veux revenir :</Text>
      <Section style={{ padding: "4px 0 20px" }}>
        <CtaButton href={`${appUrl}/pricing`}>Réactiver mon abonnement →</CtaButton>
      </Section>
      <Text style={styles.muted}>
        Une chose ne t&apos;a pas convenu ? Réponds à cet email, on prend ça très au
        sérieux.
      </Text>
      <Text style={{ ...styles.muted, marginBottom: 0 }}>— Arthur, fondateur de LogLead</Text>
    </EmailLayout>
  );
}
