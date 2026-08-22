"use client";

import { LandingFooter, LandingNavbar } from "@/components/LandingPage";
import { LangProvider, useTr } from "@/components/lpLang";

const PROSE =
  "text-[15px] leading-relaxed text-slate-600 [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-slate-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5 [&_strong]:text-slate-900 [&_a]:font-medium [&_a]:text-[#0051FF] [&_a]:underline";

export default function LegalPrivacy() {
  return (
    <LangProvider>
      <Body />
    </LangProvider>
  );
}

function Body() {
  const t = useTr();
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <LandingNavbar />
      <section className="lp-light px-5 pb-20 pt-28 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 sm:text-[40px]">
            {t("Privacy Policy", "Politique de confidentialité")}
          </h1>
          <p className="mt-2 text-[13px] text-slate-400">{t("Last updated: 20 August 2026", "Dernière mise à jour : 20 août 2026")}</p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-600">
            <p><strong className="text-slate-900">{t("Data Controller:", "Responsable du traitement :")}</strong> {t("Arthur Lorthois — Sole Proprietor", "Arthur Lorthois — Entreprise individuelle")}</p>
            <p><strong className="text-slate-900">SIRET :</strong> 104 040 456 00014</p>
            <p><strong className="text-slate-900">Email :</strong> <a href="mailto:loglead@gmail.com" className="font-medium text-[#0051FF] underline">loglead@gmail.com</a></p>
          </div>

          <div className={`mt-8 ${PROSE}`}>
            <h2>{t("1. Data Collected", "1. Données collectées")}</h2>
            <p>
              {t(
                "We collect your email address, first name, last name, and information relating to your SaaS business (name, niche, and offer) when you sign up. Payment information is processed directly by Stripe and is not stored by LogLead.",
                "Nous collectons votre adresse email, votre prénom, votre nom et les informations relatives à votre activité SaaS (nom, niche et offre) lors de votre inscription. Les informations de paiement sont traitées directement par Stripe et ne sont pas conservées par LogLead.",
              )}
            </p>

            <h2>{t("2. Use of Data", "2. Utilisation des données")}</h2>
            <p>
              {t(
                "Your data is used solely to provide you with the LogLead service, including content generation, recommendations, and editorial planning, as well as to send communications related to your account. We never sell your data to third parties.",
                "Vos données sont utilisées uniquement pour vous fournir le service LogLead, y compris la génération de contenu, les recommandations et la planification éditoriale, ainsi que pour vous envoyer des communications liées à votre compte. Nous ne vendons jamais vos données à des tiers.",
              )}
            </p>

            <h2>{t("3. Data Processors", "3. Sous-traitants")}</h2>
            <p>{t("We use the following service providers to operate LogLead:", "Nous utilisons les prestataires suivants pour faire fonctionner LogLead :")}</p>
            <ul>
              <li><strong>Supabase</strong> — {t("Database", "Base de données")}</li>
              <li><strong>Vercel</strong> — {t("Hosting", "Hébergement")}</li>
              <li><strong>Stripe</strong> — {t("Payments", "Paiements")}</li>
              <li><strong>Anthropic</strong> — {t("AI content generation", "Génération de contenu par IA")}</li>
              <li><strong>OpenAI, Google, Mistral, Perplexity, xAI</strong> — {t("AI visibility analysis", "Analyse de visibilité IA")}</li>
              <li><strong>Apify</strong> — {t("LinkedIn public data (enrichment & lead detection)", "Données publiques LinkedIn (enrichissement & détection de leads)")}</li>
              <li><strong>FullEnrich</strong> — {t("Contact enrichment (email & phone)", "Enrichissement de contacts (email & téléphone)")}</li>
              <li><strong>Firecrawl</strong> — {t("Website analysis", "Analyse de sites web")}</li>
              <li><strong>Resend</strong> — {t("Transactional emails", "Emails transactionnels")}</li>
            </ul>
            <p>
              {t(
                "All of these providers process your data strictly within the scope necessary to provide the service.",
                "Tous ces prestataires traitent vos données strictement dans la limite nécessaire à la fourniture du service.",
              )}
            </p>

            <h2>{t("4. Data Retention", "4. Conservation des données")}</h2>
            <p>
              {t(
                "Your data is retained for the entire duration of your subscription and for 30 days after cancellation. Billing and accounting data is retained for 10 years in accordance with applicable legal requirements.",
                "Vos données sont conservées pendant toute la durée de votre abonnement et pendant 30 jours après résiliation. Les données de facturation et comptables sont conservées pendant 10 ans conformément aux obligations légales applicables.",
              )}
            </p>

            <h2>{t("5. Your Rights", "5. Vos droits")}</h2>
            <p>
              {t(
                "Under the GDPR, you have the right to access, rectify, erase, and port your personal data. To exercise these rights, contact us at ",
                "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à ",
              )}
              <a href="mailto:loglead@gmail.com">loglead@gmail.com</a>.
            </p>
            <p>
              {t(
                "You may also lodge a complaint with the French Data Protection Authority (CNIL): ",
                "Vous pouvez également déposer une réclamation auprès de la CNIL : ",
              )}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
            </p>

            <h2>{t("6. Cookies", "6. Cookies")}</h2>
            <p>
              {t(
                "LogLead only uses cookies that are necessary for the operation of the service, including session and authentication cookies. ",
                "LogLead n'utilise que des cookies nécessaires au fonctionnement du service, notamment les cookies de session et d'authentification. ",
              )}
              <strong>{t("No advertising cookies are used.", "Aucun cookie publicitaire n'est utilisé.")}</strong>
            </p>
          </div>
        </article>
      </section>
      <div className="bg-[#0A0A0A]">
        <LandingFooter tone="dark" />
      </div>
    </div>
  );
}
