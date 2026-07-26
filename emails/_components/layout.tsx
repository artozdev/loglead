import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// ---------------------------------------------------------------------------
// Shared chrome for every LogLead transactional email.
// Colors are hardcoded hex on purpose: email clients don't support CSS
// variables — these mirror the app's light-theme tokens.
// ---------------------------------------------------------------------------

export const colors = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  primary: "#0051FF",
  ink: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  success: "#22C55E",
};

const font =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const styles = {
  h1: {
    margin: "0 0 16px",
    fontSize: "20px",
    lineHeight: "28px",
    fontWeight: 600 as const,
    color: colors.ink,
  },
  text: {
    margin: "0 0 16px",
    fontSize: "14px",
    lineHeight: "22px",
    color: colors.ink,
  },
  muted: {
    margin: "0 0 16px",
    fontSize: "13px",
    lineHeight: "20px",
    color: colors.muted,
  },
  small: {
    margin: "0",
    fontSize: "12px",
    lineHeight: "18px",
    color: colors.faint,
  },
};

export default function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: colors.bg, fontFamily: font }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>
          {/* Header — text-based logo (no remote images in emails) */}
          <Section style={{ textAlign: "center" as const, padding: "16px 0" }}>
            <table role="presentation" style={{ margin: "0 auto" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      backgroundColor: colors.primary,
                      color: "#FFFFFF",
                      fontFamily: font,
                      fontSize: "16px",
                      fontWeight: 700,
                      textAlign: "center" as const,
                      verticalAlign: "middle",
                    }}
                  >
                    L
                  </td>
                  <td
                    style={{
                      paddingLeft: "8px",
                      fontFamily: font,
                      fontSize: "17px",
                      fontWeight: 700,
                      color: colors.ink,
                    }}
                  >
                    LogLead
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Card */}
          <Section
            style={{
              backgroundColor: colors.card,
              borderRadius: "12px",
              border: `1px solid ${colors.line}`,
              padding: "32px",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center" as const, padding: "20px 0 8px" }}>
            <Text style={styles.small}>LogLead · Tous droits réservés 2026</Text>
            <Text style={{ ...styles.small, marginTop: "4px" }}>
              <Link href="https://app.loglead.io/settings?tab=notifications" style={{ color: colors.faint, textDecoration: "underline" }}>
                Se désabonner
              </Link>
              {" · "}
              <Link href="https://app.loglead.io/privacy" style={{ color: colors.faint, textDecoration: "underline" }}>
                Politique de confidentialité
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: colors.line, margin: "20px 0" }} />;
}
