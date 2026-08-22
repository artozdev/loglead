"use client";

import { LandingFooter, LandingNavbar } from "@/components/LandingPage";
import { LangProvider, useTr } from "@/components/lpLang";

const PROSE =
  "text-[15px] leading-relaxed text-slate-600 [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-slate-900 [&_p]:mt-3 [&_strong]:text-slate-900 [&_a]:font-medium [&_a]:text-[#0051FF] [&_a]:underline [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14px] [&_th]:border-b [&_th]:border-slate-200 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-900 [&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2";

export default function LegalTerms() {
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
            {t("Terms and Conditions of Sale", "Conditions Générales de Vente")}
          </h1>
          <p className="mt-2 text-[13px] text-slate-400">{t("Last updated: 20 August 2026", "Dernière mise à jour : 20 août 2026")}</p>

          <div className={`mt-8 ${PROSE}`}>
            <h2>{t("1. Purpose", "1. Objet")}</h2>
            <p>
              {t(
                "These Terms and Conditions of Sale govern access to the LogLead SaaS platform (app.loglead.io), an AI-powered marketing tool designed for SaaS founders and startups.",
                "Les présentes Conditions Générales de Vente régissent l'accès à la plateforme SaaS LogLead (app.loglead.io), un outil marketing propulsé par l'IA conçu pour les fondateurs de SaaS et les startups.",
              )}
            </p>

            <h2>{t("2. Plans and Pricing", "2. Offres et tarifs")}</h2>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>{t("Plan", "Offre")}</th>
                    <th className="!text-right">{t("Monthly", "Mensuel")}</th>
                    <th className="!text-right">{t("Annual", "Annuel")}</th>
                  </tr>
                </thead>
                <tbody className="[&_td:not(:first-child)]:text-right">
                  <tr><td>Starter</td><td>{t("€29 excl. VAT/month", "29 € HT/mois")}</td><td>{t("€23 excl. VAT/month", "23 € HT/mois")}</td></tr>
                  <tr><td>Growth</td><td>{t("€59 excl. VAT/month", "59 € HT/mois")}</td><td>{t("€47 excl. VAT/month", "47 € HT/mois")}</td></tr>
                  <tr><td>Pro</td><td>{t("€99 excl. VAT/month", "99 € HT/mois")}</td><td>{t("€79 excl. VAT/month", "79 € HT/mois")}</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              {t(
                "Every new account starts with a free offer of 100 one-time credits, with no credit card required. These credits do not renew and expire once used. Paid plans (Starter, Growth, Pro) are then billed by subscription as shown above.",
                "Chaque nouveau compte démarre avec une offre gratuite de 100 crédits, sans carte bancaire requise. Ces crédits ne se renouvellent pas et expirent une fois épuisés. Les offres payantes (Starter, Growth, Pro) sont ensuite facturées par abonnement selon le tableau ci-dessus.",
              )}
            </p>

            <h2>{t("3. Billing and Payment", "3. Facturation et paiement")}</h2>
            <p>
              {t(
                "Billing is monthly or annually, on the renewal date, by credit or debit card via Stripe. An invoice is available in your customer account after each renewal.",
                "La facturation est mensuelle ou annuelle, à la date de renouvellement, par carte bancaire via Stripe. Une facture est disponible dans votre espace client après chaque renouvellement.",
              )}
            </p>

            <h2>{t("4. Refunds", "4. Remboursements")}</h2>
            <p>
              {t(
                "LogLead provides a full refund for any request made within 48 hours of the first paid subscription. After this period, no partial refunds will be granted for the remainder of the billing period.",
                "LogLead accorde un remboursement intégral pour toute demande effectuée dans les 48 heures suivant le premier abonnement payant. Passé ce délai, aucun remboursement partiel ne sera accordé pour la période de facturation restante.",
              )}
            </p>

            <h2>{t("5. Cancellation", "5. Résiliation")}</h2>
            <p>
              {t(
                "You may cancel your subscription at any time from Settings > Subscription. Cancellation will take effect at the end of the current billing period.",
                "Vous pouvez résilier votre abonnement à tout moment depuis Paramètres > Abonnement. La résiliation prend effet à la fin de la période de facturation en cours.",
              )}
            </p>

            <h2>{t("6. Liability", "6. Responsabilité")}</h2>
            <p>
              {t(
                "The Customer is solely responsible for the content published through LogLead. LogLead is subject to an obligation of means and does not guarantee any specific results. LogLead's liability is limited to the amounts paid by the Customer during the previous three months.",
                "Le Client est seul responsable du contenu publié via LogLead. LogLead est soumis à une obligation de moyens et ne garantit aucun résultat spécifique. La responsabilité de LogLead est limitée aux montants payés par le Client au cours des trois derniers mois.",
              )}
            </p>

            <h2>{t("7. Intellectual Property", "7. Propriété intellectuelle")}</h2>
            <p>
              {t(
                "Content generated through the AI Studio belongs to the Customer. The LogLead platform, including its code, design, and brand, is the exclusive property of Arthur Lorthois.",
                "Le contenu généré via le Studio IA appartient au Client. La plateforme LogLead, y compris son code, son design et sa marque, est la propriété exclusive d'Arthur Lorthois.",
              )}
            </p>

            <h2>{t("8. Governing Law", "8. Droit applicable")}</h2>
            <p>
              {t(
                "These Terms and Conditions are governed by French law. In the event of a dispute that cannot be resolved amicably, the competent French courts shall have jurisdiction.",
                "Les présentes Conditions Générales sont régies par le droit français. En cas de litige ne pouvant être résolu à l'amiable, les tribunaux français compétents seront seuls habilités.",
              )}
            </p>

            <h2>{t("9. Contact", "9. Contact")}</h2>
            <p><a href="mailto:loglead@gmail.com">loglead@gmail.com</a></p>
          </div>
        </article>
      </section>
      <div className="bg-[#0A0A0A]">
        <LandingFooter tone="dark" />
      </div>
    </div>
  );
}
