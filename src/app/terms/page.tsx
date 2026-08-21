import type { Metadata } from "next";
import { LangProvider } from "@/components/lpLang";
import { LandingFooter, LandingNavbar } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Terms and Conditions of Sale",
  description: "The terms and conditions governing access to the LogLead SaaS platform.",
  alternates: { canonical: "/terms" },
};

const PROSE =
  "text-[15px] leading-relaxed text-slate-600 [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-slate-900 [&_p]:mt-3 [&_strong]:text-slate-900 [&_a]:font-medium [&_a]:text-[#0051FF] [&_a]:underline [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14px] [&_th]:border-b [&_th]:border-slate-200 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-900 [&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2";

export default function TermsPage() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <LandingNavbar />
        <section className="lp-light px-5 pb-20 pt-28 sm:px-6">
          <article className="mx-auto max-w-3xl">
            <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 sm:text-[40px]">
              Terms and Conditions of Sale
            </h1>
            <p className="mt-2 text-[13px] text-slate-400">Last updated: 20 August 2026</p>

            <div className={`mt-8 ${PROSE}`}>
              <h2>1. Purpose</h2>
              <p>
                These Terms and Conditions of Sale govern access to the LogLead SaaS platform
                (app.loglead.io), an AI-powered marketing tool designed for SaaS founders and startups.
              </p>

              <h2>2. Plans and Pricing</h2>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th className="!text-right">Monthly</th>
                      <th className="!text-right">Annual</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td:not(:first-child)]:text-right">
                    <tr><td>Starter</td><td>€29 excl. VAT/month</td><td>€23 excl. VAT/month</td></tr>
                    <tr><td>Growth</td><td>€59 excl. VAT/month</td><td>€47 excl. VAT/month</td></tr>
                    <tr><td>Pro</td><td>€99 excl. VAT/month</td><td>€79 excl. VAT/month</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                Every new account starts with a <strong>free offer of 100 one-time credits, with no credit
                card required</strong>. These credits do not renew and expire once used. Paid plans (Starter,
                Growth, Pro) are then billed by subscription as shown above.
              </p>

              <h2>3. Billing and Payment</h2>
              <p>
                Billing is monthly or annually, on the renewal date, by credit or debit card via Stripe.
                An invoice is available in your customer account after each renewal.
              </p>

              <h2>4. Refunds</h2>
              <p>
                LogLead provides a full refund for any request made within <strong>48 hours of the first
                paid subscription</strong>. After this period, no partial refunds will be granted for the
                remainder of the billing period.
              </p>

              <h2>5. Cancellation</h2>
              <p>
                You may cancel your subscription at any time from <strong>Settings &gt; Subscription</strong>.
                Cancellation will take effect at the end of the current billing period.
              </p>

              <h2>6. Liability</h2>
              <p>
                The Customer is solely responsible for the content published through LogLead. LogLead is
                subject to an obligation of means and does not guarantee any specific results. LogLead&apos;s
                liability is limited to the amounts paid by the Customer during the previous three months.
              </p>

              <h2>7. Intellectual Property</h2>
              <p>
                Content generated through the AI Studio belongs to the Customer. The LogLead platform,
                including its code, design, and brand, is the exclusive property of Arthur Lorthois.
              </p>

              <h2>8. Governing Law</h2>
              <p>
                These Terms and Conditions are governed by French law. In the event of a dispute that
                cannot be resolved amicably, the competent French courts shall have jurisdiction.
              </p>

              <h2>9. Contact</h2>
              <p>
                <a href="mailto:loglead@gmail.com">loglead@gmail.com</a>
              </p>
            </div>
          </article>
        </section>
        <div className="bg-[#0A0A0A]">
          <LandingFooter tone="dark" />
        </div>
      </div>
    </LangProvider>
  );
}
