import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { styles } from "./_components/layout";

// Email 6 — password reset link (valid 1 hour).
export default function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailLayout preview="Réinitialise ton mot de passe LogLead">
      <Text style={styles.h1}>Réinitialise ton mot de passe</Text>
      <Text style={styles.text}>Bonjour,</Text>
      <Text style={styles.text}>
        Tu as demandé à réinitialiser ton mot de passe LogLead. Clique sur le bouton
        ci-dessous pour créer un nouveau mot de passe.
      </Text>
      <Section style={{ padding: "8px 0 20px" }}>
        <CtaButton href={resetUrl}>Réinitialiser mon mot de passe →</CtaButton>
      </Section>
      <Text style={styles.muted}>Ce lien expire dans 1 heure.</Text>
      <Text style={styles.muted}>
        Si tu n&apos;as pas fait cette demande, ignore cet email. Ton mot de passe actuel
        reste inchangé.
      </Text>
    </EmailLayout>
  );
}
