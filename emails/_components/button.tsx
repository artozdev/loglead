import { Button } from "@react-email/components";
import { colors } from "./layout";

// Primary CTA — blue pill per the LogLead email design rules.
export default function CtaButton({ href, children }: { href: string; children: string }) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.primary,
        color: "#FFFFFF",
        fontSize: "14px",
        fontWeight: 600,
        borderRadius: "8px",
        padding: "12px 24px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
