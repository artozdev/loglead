import type { Metadata } from "next";
import { LangProvider } from "@/components/lpLang";
import { LandingFooter, LandingNavbar } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Privacy Policy · LogLead",
  description: "How LogLead collects, uses, and protects your personal data.",
};

const PROSE =
  "text-[15px] leading-relaxed text-slate-600 [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-slate-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5 [&_strong]:text-slate-900 [&_a]:font-medium [&_a]:text-[#0051FF] [&_a]:underline";

export default function PrivacyPage() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <LandingNavbar />
        <section className="lp-light px-5 pb-20 pt-28 sm:px-6">
          <article className="mx-auto max-w-3xl">
            <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 sm:text-[40px]">
              Privacy Policy
            </h1>
            <p className="mt-2 text-[13px] text-slate-400">Last updated: 20 August 2026</p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-600">
              <p><strong className="text-slate-900">Data Controller:</strong> Arthur Lorthois — Sole Proprietor</p>
              <p><strong className="text-slate-900">SIRET:</strong> 104 040 456 00014</p>
              <p><strong className="text-slate-900">Email:</strong> <a href="mailto:loglead@gmail.com" className="font-medium text-[#0051FF] underline">loglead@gmail.com</a></p>
            </div>

            <div className={`mt-8 ${PROSE}`}>
              <h2>1. Data Collected</h2>
              <p>
                We collect your email address, first name, last name, and information relating to your
                SaaS business (name, niche, and offer) when you sign up. Payment information is processed
                directly by Stripe and is not stored by LogLead.
              </p>

              <h2>2. Use of Data</h2>
              <p>
                Your data is used solely to provide you with the LogLead service, including content
                generation, recommendations, and editorial planning, as well as to send communications
                related to your account. We never sell your data to third parties.
              </p>

              <h2>3. Data Processors</h2>
              <p>We use the following service providers to operate LogLead:</p>
              <ul>
                <li><strong>Supabase</strong> — Database</li>
                <li><strong>Vercel</strong> — Hosting</li>
                <li><strong>Stripe</strong> — Payments</li>
                <li><strong>Anthropic</strong> — AI content generation</li>
                <li><strong>OpenAI, Google, Mistral, Perplexity, xAI</strong> — AI visibility analysis</li>
                <li><strong>Apify</strong> — LinkedIn public data (enrichment &amp; lead detection)</li>
                <li><strong>FullEnrich</strong> — Contact enrichment (email &amp; phone)</li>
                <li><strong>Firecrawl</strong> — Website analysis</li>
                <li><strong>Resend</strong> — Transactional emails</li>
              </ul>
              <p>
                All of these providers process your data strictly within the scope necessary to provide
                the service.
              </p>

              <h2>4. Data Retention</h2>
              <p>
                Your data is retained for the entire duration of your subscription and for
                <strong> 30 days after cancellation</strong>. Billing and accounting data is retained for
                <strong> 10 years</strong> in accordance with applicable legal requirements.
              </p>

              <h2>5. Your Rights</h2>
              <p>
                Under the GDPR, you have the right to access, rectify, erase, and port your personal data.
                To exercise these rights, contact us at <a href="mailto:loglead@gmail.com">loglead@gmail.com</a>.
              </p>
              <p>
                You may also lodge a complaint with the French Data Protection Authority (CNIL):{" "}
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
              </p>

              <h2>6. Cookies</h2>
              <p>
                LogLead only uses cookies that are necessary for the operation of the service, including
                session and authentication cookies. <strong>No advertising cookies are used.</strong>
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
