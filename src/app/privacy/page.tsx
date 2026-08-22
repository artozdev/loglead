import type { Metadata } from "next";
import LegalPrivacy from "@/components/seo/LegalPrivacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LogLead collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPrivacy />;
}
