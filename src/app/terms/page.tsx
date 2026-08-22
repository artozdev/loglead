import type { Metadata } from "next";
import LegalTerms from "@/components/seo/LegalTerms";

export const metadata: Metadata = {
  title: "Terms and Conditions of Sale",
  description: "The terms and conditions governing access to the LogLead SaaS platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalTerms />;
}
