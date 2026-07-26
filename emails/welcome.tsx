import { Link, Section, Text } from "@react-email/components";
import EmailLayout, { colors, Divider, styles } from "./_components/layout";

// Email 2 — welcome after onboarding completes.
export default function WelcomeEmail({
  firstName,
  saasName,
  appUrl,
}: {
  firstName: string;
  saasName: string;
  appUrl: string;
}) {
  const step = (n: number, title: string, desc: string, href: string, cta: string) => (
    <Section style={{ padding: "6px 0" }}>
      <Text style={{ ...styles.text, margin: "0 0 2px", fontWeight: 600 }}>
        {n}. {title} →
      </Text>
      <Text style={{ ...styles.muted, margin: "0 0 4px" }}>{desc}</Text>
      <Link href={href} style={{ color: colors.primary, fontSize: "13px", fontWeight: 600 }}>
        {cta}
      </Link>
    </Section>
  );

  return (
    <EmailLayout preview="Ton espace LogLead est prêt — voici par où commencer">
      <Text style={styles.h1}>Ton espace LogLead est prêt</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>
        Ton SaaS <strong>{saasName}</strong> est maintenant configuré sur LogLead. Voici
        les 3 premières choses à faire :
      </Text>
      <Divider />
      {step(
        1,
        "Découvre les recommandations de ta niche",
        "L'Algo Insider a analysé les algorithmes pour toi.",
        `${appUrl}/algo-insider`,
        "Ouvrir l'Algo Insider",
      )}
      {step(
        2,
        "Génère ton premier contenu",
        "Post LinkedIn, script Reel, thread X — en 60 secondes.",
        `${appUrl}/studio`,
        "Ouvrir le Studio IA",
      )}
      {step(
        3,
        "Analyse un contenu existant",
        "Colle le lien d'une vidéo ou d'un post pour voir ce qui cloche.",
        `${appUrl}/content-analyzer`,
        "Ouvrir l'Analyseur",
      )}
      <Divider />
      <Text style={styles.muted}>
        À tout de suite sur LogLead,
        <br />
        Arthur — fondateur de LogLead
      </Text>
    </EmailLayout>
  );
}
