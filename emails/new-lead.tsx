import { Section, Text } from "@react-email/components";
import CtaButton from "./_components/button";
import EmailLayout, { colors, styles } from "./_components/layout";

// Email 9 — a new lead just landed in the CRM.
export default function NewLeadEmail({
  firstName,
  leadName,
  channel,
  sourceTitle,
  capturedAt,
  appUrl,
}: {
  firstName: string;
  leadName: string;
  channel: string;
  sourceTitle: string | null;
  capturedAt: string;
  appUrl: string;
}) {
  const row = (label: string, value: string) => (
    <tr>
      <td style={{ padding: "4px 24px 4px 0", fontSize: "13px", color: colors.muted, whiteSpace: "nowrap" as const }}>
        {label}
      </td>
      <td style={{ padding: "4px 0", fontSize: "13px", color: colors.ink, fontWeight: 500 }}>{value}</td>
    </tr>
  );

  return (
    <EmailLayout preview={`Nouveau lead depuis ${channel} — ${leadName}`}>
      <Text style={styles.h1}>Tu as un nouveau prospect 👤</Text>
      <Text style={styles.text}>Bonjour {firstName},</Text>
      <table role="presentation" style={{ margin: "4px 0 16px" }}>
        <tbody>
          {row("Nom", leadName)}
          {row("Canal", channel)}
          {sourceTitle ? row("Source", sourceTitle) : null}
          {row("Capté le", capturedAt)}
        </tbody>
      </table>
      <Section style={{ padding: "4px 0 20px" }}>
        <CtaButton href={`${appUrl}/leads`}>Voir le lead →</CtaButton>
      </Section>
      <Text style={styles.muted}>
        Contacte-le rapidement — les leads convertissent 3x mieux dans les premières 24h.
      </Text>
    </EmailLayout>
  );
}
