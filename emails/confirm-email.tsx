import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { styles } from "./_components/layout";

// Email 1 — confirm the address after an email signup (link valid 24h).
export default function ConfirmEmail({
  firstName,
  confirmUrl,
}: {
  firstName: string;
  confirmUrl: string;
}) {
  return (
    <EmailLayout preview="Confirme ton adresse email — LogLead">
      <Text style={styles.h1}>Bienvenue sur LogLead 👋</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>
        Clique sur le bouton ci-dessous pour confirmer ton adresse email et accéder à
        ton compte.
      </Text>
      <Section style={{ padding: "8px 0 20px" }}>
        <CtaButton href={confirmUrl}>Confirmer mon email →</CtaButton>
      </Section>
      <Text style={styles.muted}>Ce lien expire dans 24 heures.</Text>
      <Text style={styles.muted}>
        Si tu n&apos;as pas créé de compte sur LogLead, ignore cet email.
      </Text>
    </EmailLayout>
  );
}
