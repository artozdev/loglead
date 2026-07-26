import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { colors, styles } from "./_components/layout";

// Email 7 — payment received (Stripe webhook).
export default function PaymentConfirmedEmail({
  firstName,
  plan,
  amount,
  dateLabel,
  invoiceNumber,
  invoiceUrl,
  renewalDate,
  appUrl,
}: {
  firstName: string;
  plan: string; // "Growth" | "Pro"
  amount: string; // "59€"
  dateLabel: string;
  invoiceNumber: string;
  invoiceUrl: string;
  renewalDate: string;
  appUrl: string;
}) {
  const row = (label: string, value: string) => (
    <tr>
      <td style={{ padding: "4px 24px 4px 0", fontSize: "13px", color: colors.muted }}>{label}</td>
      <td style={{ padding: "4px 0", fontSize: "13px", color: colors.ink, fontWeight: 500 }}>{value}</td>
    </tr>
  );

  return (
    <EmailLayout preview={`Paiement confirmé — LogLead ${plan}`}>
      <Text style={styles.h1}>Paiement confirmé ✅</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <Text style={styles.text}>Ton paiement a bien été reçu. Merci !</Text>
      <Text style={{ ...styles.text, margin: "0 0 4px", fontWeight: 600 }}>Récapitulatif :</Text>
      <table role="presentation" style={{ margin: "0 0 16px" }}>
        <tbody>
          {row("Plan", `LogLead ${plan}`)}
          {row("Montant", `${amount} HT`)}
          {row("Date", dateLabel)}
          {row("Facture", `#${invoiceNumber}`)}
        </tbody>
      </table>
      <Section style={{ padding: "0 0 20px" }}>
        <CtaButton href={invoiceUrl}>Télécharger ma facture →</CtaButton>
      </Section>
      <Text style={styles.muted}>
        Ton abonnement se renouvelle le {renewalDate}. Tu peux gérer ton abonnement
        depuis{" "}
        <a href={`${appUrl}/settings?tab=facturation`} style={{ color: colors.primary }}>
          Paramètres &gt; Facturation
        </a>
        .
      </Text>
      <Text style={{ ...styles.muted, marginBottom: 0 }}>
        Merci de faire confiance à LogLead,
        <br />
        Arthur
      </Text>
    </EmailLayout>
  );
}
