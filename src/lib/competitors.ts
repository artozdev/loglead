// Single source of truth for the /vs/* and /alternative/* comparison pages.
// Bilingual (en/fr) — the toggle switches the whole page. Tone rule: honest and
// factual, never disparaging.

export type L = { en: string; fr: string };
export type CompareRow = { feature: L; loglead: L; them: L };

export type Competitor = {
  slug: string;
  name: string;
  hasVs: boolean;
  hasAlternative: boolean;
  intro: L;
  bestFor: L;
  rows: CompareRow[];
  whyLoglead: L[];
  whenThem: L[];
  faq: { q: L; a: L }[];
};

const l = (en: string, fr: string): L => ({ en, fr });

export const COMPETITORS: Competitor[] = [
  {
    slug: "lemlist",
    name: "Lemlist",
    hasVs: true,
    hasAlternative: true,
    intro: l(
      "Lemlist is a cold email and multichannel outreach platform built around sending personalized email sequences (with LinkedIn steps and calls) at scale, plus email warm-up for deliverability.",
      "Lemlist est une plateforme de cold email et d'outreach multicanal, centrée sur l'envoi de séquences d'emails personnalisés à grande échelle (avec étapes LinkedIn et appels) et le warm-up d'emails pour la délivrabilité.",
    ),
    bestFor: l(
      "teams running high-volume outbound email sequences who want deliverability tooling and a built-in lead database.",
      "les équipes qui font de l'outbound email à fort volume et veulent des outils de délivrabilité et une base de contacts intégrée.",
    ),
    rows: [
      { feature: l("Core approach", "Approche principale"), loglead: l("Inbound + warm leads from LinkedIn engagement", "Inbound + leads chauds depuis l'engagement LinkedIn"), them: l("Outbound cold email sequences", "Séquences de cold email outbound") },
      { feature: l("LinkedIn content generation", "Génération de contenu LinkedIn"), loglead: l("Yes — in your voice", "Oui — dans ta voix"), them: l("No", "Non") },
      { feature: l("Market intelligence", "Veille marché"), loglead: l("Yes — trends, competitors, signals", "Oui — tendances, concurrents, signaux"), them: l("No", "Non") },
      { feature: l("Leads from your post engagement", "Leads depuis l'engagement de tes posts"), loglead: l("Yes — auto-detected", "Oui — détection auto"), them: l("No", "Non") },
      { feature: l("Lead enrichment (email/phone)", "Enrichissement (email/téléphone)"), loglead: l("Yes", "Oui"), them: l("Yes", "Oui") },
      { feature: l("AI visibility tracking (GEO)", "Suivi de visibilité IA (GEO)"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Cold email sending at scale", "Envoi de cold email à grande échelle"), loglead: l("Not the focus", "Pas la priorité"), them: l("Yes", "Oui") },
      { feature: l("Entry price", "Prix d'entrée"), loglead: l("Free, then €29/mo", "Gratuit, puis 29 €/mois"), them: l("Paid plans only", "Offres payantes uniquement") },
    ],
    whyLoglead: [
      l("LogLead turns the people who already engage with your LinkedIn posts into scored leads — warm intent instead of cold lists.", "LogLead transforme les personnes qui interagissent déjà avec tes posts LinkedIn en leads scorés — de l'intention chaude plutôt que des listes froides."),
      l("You get market intelligence (trends, competitor activity, buying signals) that a pure sending tool doesn't provide.", "Tu obtiens une veille marché (tendances, activité des concurrents, signaux d'achat) qu'un simple outil d'envoi ne fournit pas."),
      l("AI content is written in your voice from your real posts, so distribution and lead generation live in one place.", "Le contenu IA est écrit dans ta voix à partir de tes vrais posts : distribution et génération de leads au même endroit."),
      l("AI visibility (GEO) tracks whether ChatGPT, Perplexity and Gemini recommend you — a channel Lemlist doesn't cover.", "La visibilité IA (GEO) suit si ChatGPT, Perplexity et Gemini te recommandent — un canal que Lemlist ne couvre pas."),
    ],
    whenThem: [
      l("You run large cold-email campaigns and need advanced sending, warm-up and deliverability controls.", "Tu fais de grosses campagnes de cold email et as besoin d'envoi avancé, de warm-up et de contrôles de délivrabilité."),
      l("Your motion is outbound-first and you already have strong target lists.", "Ta stratégie est outbound-first et tu as déjà de bonnes listes cibles."),
    ],
    faq: [
      { q: l("Is LogLead a Lemlist alternative?", "LogLead est-il une alternative à Lemlist ?"), a: l("LogLead is an alternative for teams who want to generate B2B leads through LinkedIn content and engagement rather than cold email. Lemlist focuses on outbound email sequencing; LogLead focuses on inbound signals, warm leads and content.", "LogLead est une alternative pour les équipes qui veulent générer des leads B2B via le contenu et l'engagement LinkedIn plutôt que le cold email. Lemlist se concentre sur les séquences d'email outbound ; LogLead sur les signaux inbound, les leads chauds et le contenu.") },
      { q: l("Can I migrate from Lemlist to LogLead?", "Puis-je migrer de Lemlist vers LogLead ?"), a: l("Yes. Start free with 100 credits, connect your LinkedIn profile URL, and LogLead detects the prospects already engaging with your content. There is no complex import to run.", "Oui. Commence gratuitement avec 100 crédits, connecte l'URL de ton profil LinkedIn, et LogLead détecte les prospects qui interagissent déjà avec ton contenu. Aucun import complexe à lancer.") },
      { q: l("Does LogLead send cold emails like Lemlist?", "LogLead envoie-t-il des cold emails comme Lemlist ?"), a: l("No. LogLead is built around LinkedIn content, market intelligence and warm-lead detection. If high-volume cold email is your core channel, Lemlist is a better fit.", "Non. LogLead est construit autour du contenu LinkedIn, de la veille marché et de la détection de leads chauds. Si le cold email à fort volume est ton canal principal, Lemlist est plus adapté.") },
      { q: l("Which is cheaper, LogLead or Lemlist?", "Lequel est le moins cher, LogLead ou Lemlist ?"), a: l("LogLead has a free offer (100 credits, no card) and paid plans from €29/mo. Pricing depends on usage; compare the plans that match your volume.", "LogLead propose une offre gratuite (100 crédits, sans carte) et des offres payantes dès 29 €/mois. Le prix dépend de l'usage ; compare les offres selon ton volume.") },
      { q: l("Does LogLead do lead enrichment?", "LogLead fait-il de l'enrichissement de leads ?"), a: l("Yes — LogLead enriches leads with email and phone, and scores them by buying intent.", "Oui — LogLead enrichit les leads avec l'email et le téléphone, et les score selon l'intention d'achat.") },
    ],
  },
  {
    slug: "apollo",
    name: "Apollo",
    hasVs: true,
    hasAlternative: true,
    intro: l(
      "Apollo is a B2B sales platform combining a large contact database (hundreds of millions of records) with email sequencing and a dialer, aimed at outbound sales teams.",
      "Apollo est une plateforme de vente B2B combinant une grande base de contacts (des centaines de millions d'enregistrements) avec des séquences d'emails et un dialer, destinée aux équipes commerciales outbound.",
    ),
    bestFor: l(
      "outbound sales teams that need a big searchable contact database and multi-touch sequencing in one tool.",
      "les équipes commerciales outbound qui ont besoin d'une grande base de contacts recherchable et de séquences multi-touch dans un seul outil.",
    ),
    rows: [
      { feature: l("Core approach", "Approche principale"), loglead: l("LinkedIn content + warm engagement leads", "Contenu LinkedIn + leads chauds via engagement"), them: l("Database + outbound sequencing", "Base de données + séquences outbound") },
      { feature: l("LinkedIn content generation", "Génération de contenu LinkedIn"), loglead: l("Yes — in your voice", "Oui — dans ta voix"), them: l("No", "Non") },
      { feature: l("Market intelligence", "Veille marché"), loglead: l("Yes", "Oui"), them: l("Limited", "Limitée") },
      { feature: l("Leads from your post engagement", "Leads depuis l'engagement de tes posts"), loglead: l("Yes — auto-detected", "Oui — détection auto"), them: l("No", "Non") },
      { feature: l("Contact database size", "Taille de la base de contacts"), loglead: l("Focused on LinkedIn signals", "Axée sur les signaux LinkedIn"), them: l("Very large", "Très grande") },
      { feature: l("Lead enrichment", "Enrichissement de leads"), loglead: l("Yes (email/phone)", "Oui (email/téléphone)"), them: l("Yes", "Oui") },
      { feature: l("AI visibility tracking (GEO)", "Suivi de visibilité IA (GEO)"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Entry price", "Prix d'entrée"), loglead: l("Free, then €29/mo", "Gratuit, puis 29 €/mois"), them: l("Free tier + paid", "Offre gratuite + payant") },
    ],
    whyLoglead: [
      l("LogLead prioritizes warm intent — people engaging with your content — over cold database outreach.", "LogLead privilégie l'intention chaude — les gens qui interagissent avec ton contenu — plutôt que l'outreach froid sur base de données."),
      l("AI content generation and an editorial calendar keep you consistently visible on LinkedIn.", "La génération de contenu IA et un calendrier éditorial te gardent visible en continu sur LinkedIn."),
      l("Market intelligence surfaces trends, competitor moves and buying signals in your niche.", "La veille marché fait remonter les tendances, les mouvements des concurrents et les signaux d'achat de ta niche."),
      l("AI visibility (GEO) tracking shows how AI assistants describe and recommend your company.", "Le suivi de visibilité IA (GEO) montre comment les assistants IA décrivent et recommandent ton entreprise."),
    ],
    whenThem: [
      l("You need the largest possible searchable contact database for cold outbound.", "Tu as besoin de la plus grande base de contacts recherchable possible pour l'outbound froid."),
      l("Your team lives in sequences and dialer workflows at high volume.", "Ton équipe vit dans les séquences et le dialer à fort volume."),
    ],
    faq: [
      { q: l("Is LogLead an Apollo alternative?", "LogLead est-il une alternative à Apollo ?"), a: l("Yes, for teams that prefer LinkedIn-led growth — content, engagement and warm leads — over a large cold-outreach database. Apollo is stronger as a raw contact database and sequencer.", "Oui, pour les équipes qui préfèrent une croissance pilotée par LinkedIn — contenu, engagement et leads chauds — plutôt qu'une grande base d'outreach froid. Apollo est plus fort comme base de contacts brute et outil de séquençage.") },
      { q: l("Does LogLead have a contact database like Apollo?", "LogLead a-t-il une base de contacts comme Apollo ?"), a: l("LogLead focuses on LinkedIn signals and the prospects who engage with you, then enriches them. Apollo's advantage is the size of its static database.", "LogLead se concentre sur les signaux LinkedIn et les prospects qui interagissent avec toi, puis les enrichit. L'avantage d'Apollo est la taille de sa base statique.") },
      { q: l("Can LogLead enrich emails and phone numbers?", "LogLead peut-il enrichir emails et téléphones ?"), a: l("Yes — LogLead enriches leads with verified email and phone and scores them by intent.", "Oui — LogLead enrichit les leads avec email et téléphone vérifiés et les score selon l'intention.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes, LogLead starts free with 100 credits and no credit card required.", "Oui, LogLead démarre gratuitement avec 100 crédits, sans carte bancaire.") },
      { q: l("Which should a small B2B team choose?", "Que choisir pour une petite équipe B2B ?"), a: l("If distribution and warm inbound leads on LinkedIn matter most, LogLead. If cold database outbound is your core motion, Apollo.", "Si la distribution et les leads inbound chauds sur LinkedIn comptent le plus, LogLead. Si l'outbound froid sur base de données est ton cœur, Apollo.") },
    ],
  },
  {
    slug: "taplio",
    name: "Taplio",
    hasVs: true,
    hasAlternative: true,
    intro: l(
      "Taplio is a LinkedIn personal-branding tool focused on content creation, scheduling and post analytics, with a library of viral posts and AI writing assistance.",
      "Taplio est un outil de personal branding LinkedIn centré sur la création de contenu, la planification et les analytics de posts, avec une bibliothèque de posts viraux et une aide à la rédaction par IA.",
    ),
    bestFor: l(
      "creators and founders who mainly want to schedule LinkedIn content and grow an audience.",
      "les créateurs et fondateurs qui veulent surtout planifier du contenu LinkedIn et développer une audience.",
    ),
    rows: [
      { feature: l("Core approach", "Approche principale"), loglead: l("Content + leads + market intelligence", "Contenu + leads + veille marché"), them: l("LinkedIn content & scheduling", "Contenu LinkedIn & planification") },
      { feature: l("LinkedIn content generation", "Génération de contenu LinkedIn"), loglead: l("Yes — in your voice", "Oui — dans ta voix"), them: l("Yes", "Oui") },
      { feature: l("Leads from your post engagement", "Leads depuis l'engagement de tes posts"), loglead: l("Yes — auto-detected & scored", "Oui — détectés et scorés auto"), them: l("Limited", "Limité") },
      { feature: l("Lead enrichment (email/phone)", "Enrichissement (email/téléphone)"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Market intelligence", "Veille marché"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("AI visibility tracking (GEO)", "Suivi de visibilité IA (GEO)"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Lead scoring by intent", "Scoring des leads par intention"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Entry price", "Prix d'entrée"), loglead: l("Free, then €29/mo", "Gratuit, puis 29 €/mois"), them: l("Paid plans only", "Offres payantes uniquement") },
    ],
    whyLoglead: [
      l("LogLead does content and turns the resulting engagement into scored, enriched leads — not just scheduling.", "LogLead fait du contenu ET transforme l'engagement obtenu en leads scorés et enrichis — pas seulement de la planification."),
      l("Market intelligence tells you what your market is talking about before you write.", "La veille marché te dit de quoi parle ton marché avant même d'écrire."),
      l("Lead detection auto-imports the people who react and comment on your posts.", "La détection de leads importe automatiquement les personnes qui réagissent et commentent tes posts."),
      l("AI visibility (GEO) tracking is included, so you also measure presence in AI search.", "Le suivi de visibilité IA (GEO) est inclus, tu mesures aussi ta présence dans la recherche IA."),
    ],
    whenThem: [
      l("You only want to schedule LinkedIn posts and track post analytics.", "Tu veux uniquement planifier des posts LinkedIn et suivre leurs analytics."),
      l("Lead generation and enrichment are not part of your workflow.", "La génération de leads et l'enrichissement ne font pas partie de ton workflow."),
    ],
    faq: [
      { q: l("Is LogLead a Taplio alternative?", "LogLead est-il une alternative à Taplio ?"), a: l("Yes. Taplio is great for LinkedIn content and scheduling; LogLead adds market intelligence, warm-lead detection from your engagement, enrichment and AI-visibility tracking.", "Oui. Taplio est très bien pour le contenu et la planification LinkedIn ; LogLead ajoute la veille marché, la détection de leads chauds via ton engagement, l'enrichissement et le suivi de visibilité IA.") },
      { q: l("Does LogLead generate LinkedIn content like Taplio?", "LogLead génère-t-il du contenu LinkedIn comme Taplio ?"), a: l("Yes — LogLead generates posts in your own voice, learned from your real posts, and plans them on an editorial calendar.", "Oui — LogLead génère des posts dans ta propre voix, apprise de tes vrais posts, et les planifie sur un calendrier éditorial.") },
      { q: l("What does LogLead add beyond content?", "Qu'ajoute LogLead au-delà du contenu ?"), a: l("It detects and scores the prospects who engage with your posts, enriches their contact data, and tracks your visibility on AI assistants.", "Il détecte et score les prospects qui interagissent avec tes posts, enrichit leurs coordonnées et suit ta visibilité sur les assistants IA.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes, LogLead starts free with 100 credits, no credit card required.", "Oui, LogLead démarre gratuitement avec 100 crédits, sans carte bancaire.") },
      { q: l("Which is better for founders?", "Lequel est meilleur pour les fondateurs ?"), a: l("If you want content plus a pipeline of warm leads, LogLead. If you only need a LinkedIn scheduler, Taplio may be enough.", "Si tu veux du contenu ET un pipeline de leads chauds, LogLead. Si tu veux seulement un planificateur LinkedIn, Taplio peut suffire.") },
    ],
  },
  {
    slug: "clay",
    name: "Clay",
    hasVs: true,
    hasAlternative: true,
    intro: l(
      "Clay is a spreadsheet-style data enrichment and go-to-market automation platform that connects dozens of data providers and AI to build custom prospecting workflows.",
      "Clay est une plateforme d'enrichissement de données et d'automatisation go-to-market en mode tableur, qui connecte des dizaines de fournisseurs de données et l'IA pour construire des workflows de prospection sur mesure.",
    ),
    bestFor: l(
      "RevOps and technical growth teams who want to build highly custom enrichment and automation pipelines.",
      "les équipes RevOps et growth techniques qui veulent construire des pipelines d'enrichissement et d'automatisation très personnalisés.",
    ),
    rows: [
      { feature: l("Core approach", "Approche principale"), loglead: l("LinkedIn growth, ready out of the box", "Croissance LinkedIn, prête à l'emploi"), them: l("Custom data/automation workflows", "Workflows data/automatisation sur mesure") },
      { feature: l("Setup effort", "Effort de mise en place"), loglead: l("Low — guided", "Faible — guidé"), them: l("High — build-your-own", "Élevé — à construire soi-même") },
      { feature: l("LinkedIn content generation", "Génération de contenu LinkedIn"), loglead: l("Yes — in your voice", "Oui — dans ta voix"), them: l("No", "Non") },
      { feature: l("Leads from your post engagement", "Leads depuis l'engagement de tes posts"), loglead: l("Yes — auto-detected", "Oui — détection auto"), them: l("Via custom setup", "Via configuration sur mesure") },
      { feature: l("Lead enrichment", "Enrichissement de leads"), loglead: l("Yes (email/phone)", "Oui (email/téléphone)"), them: l("Yes — many sources", "Oui — nombreuses sources") },
      { feature: l("Market intelligence", "Veille marché"), loglead: l("Yes", "Oui"), them: l("Build-your-own", "À construire soi-même") },
      { feature: l("AI visibility tracking (GEO)", "Suivi de visibilité IA (GEO)"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Entry price", "Prix d'entrée"), loglead: l("Free, then €29/mo", "Gratuit, puis 29 €/mois"), them: l("Free tier + paid", "Offre gratuite + payant") },
    ],
    whyLoglead: [
      l("LogLead works out of the box — no workflow building, credits or data-provider wiring required.", "LogLead fonctionne prêt à l'emploi — aucun workflow à construire, aucun branchement de fournisseurs de données requis."),
      l("Content generation and distribution are built in, not something you assemble.", "La génération de contenu et la distribution sont intégrées, pas quelque chose à assembler."),
      l("Warm leads come from your own LinkedIn engagement, automatically scored.", "Les leads chauds viennent de ton propre engagement LinkedIn, scorés automatiquement."),
      l("AI visibility (GEO) tracking is included for the AI-search channel.", "Le suivi de visibilité IA (GEO) est inclus pour le canal de la recherche IA."),
    ],
    whenThem: [
      l("You have RevOps resources and want fully custom enrichment/automation pipelines.", "Tu as des ressources RevOps et veux des pipelines d'enrichissement/automatisation entièrement sur mesure."),
      l("You need to combine many data providers with bespoke logic.", "Tu dois combiner de nombreux fournisseurs de données avec une logique sur mesure."),
    ],
    faq: [
      { q: l("Is LogLead a Clay alternative?", "LogLead est-il une alternative à Clay ?"), a: l("Yes, for teams that want LinkedIn-led growth without building custom workflows. Clay is more powerful and flexible but requires setup; LogLead is ready to use.", "Oui, pour les équipes qui veulent une croissance pilotée par LinkedIn sans construire de workflows sur mesure. Clay est plus puissant et flexible mais nécessite de la configuration ; LogLead est prêt à l'emploi.") },
      { q: l("Does LogLead enrich data like Clay?", "LogLead enrichit-il les données comme Clay ?"), a: l("LogLead enriches leads with email and phone and scores them. Clay connects many data sources for bespoke enrichment, which is more flexible but more technical.", "LogLead enrichit les leads avec email et téléphone et les score. Clay connecte de nombreuses sources pour un enrichissement sur mesure, plus flexible mais plus technique.") },
      { q: l("Do I need technical skills to use LogLead?", "Faut-il des compétences techniques pour utiliser LogLead ?"), a: l("No. LogLead is guided and works out of the box, whereas Clay is closer to a build-your-own platform.", "Non. LogLead est guidé et fonctionne prêt à l'emploi, tandis que Clay est plus proche d'une plateforme à construire soi-même.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — LogLead starts free with 100 credits, no credit card required.", "Oui — LogLead démarre gratuitement avec 100 crédits, sans carte bancaire.") },
      { q: l("Which is better for a small team?", "Lequel est meilleur pour une petite équipe ?"), a: l("If you want results without engineering effort, LogLead. If you want maximum customization and have the resources, Clay.", "Si tu veux des résultats sans effort d'ingénierie, LogLead. Si tu veux un maximum de personnalisation et as les ressources, Clay.") },
    ],
  },
  {
    slug: "instantly",
    name: "Instantly",
    hasVs: true,
    hasAlternative: false,
    intro: l(
      "Instantly is a cold email platform focused on sending at scale — unlimited inboxes, warm-up and deliverability tooling for high-volume outbound.",
      "Instantly est une plateforme de cold email centrée sur l'envoi à grande échelle — boîtes mail illimitées, warm-up et outils de délivrabilité pour l'outbound à fort volume.",
    ),
    bestFor: l(
      "teams that send large volumes of cold email and need deliverability and inbox rotation.",
      "les équipes qui envoient de gros volumes de cold email et ont besoin de délivrabilité et de rotation de boîtes mail.",
    ),
    rows: [
      { feature: l("Core approach", "Approche principale"), loglead: l("LinkedIn content + warm engagement leads", "Contenu LinkedIn + leads chauds via engagement"), them: l("High-volume cold email", "Cold email à fort volume") },
      { feature: l("LinkedIn content generation", "Génération de contenu LinkedIn"), loglead: l("Yes — in your voice", "Oui — dans ta voix"), them: l("No", "Non") },
      { feature: l("Leads from your post engagement", "Leads depuis l'engagement de tes posts"), loglead: l("Yes — auto-detected", "Oui — détection auto"), them: l("No", "Non") },
      { feature: l("Market intelligence", "Veille marché"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Lead enrichment (email/phone)", "Enrichissement (email/téléphone)"), loglead: l("Yes", "Oui"), them: l("Limited", "Limité") },
      { feature: l("AI visibility tracking (GEO)", "Suivi de visibilité IA (GEO)"), loglead: l("Yes", "Oui"), them: l("No", "Non") },
      { feature: l("Cold email at scale", "Cold email à grande échelle"), loglead: l("Not the focus", "Pas la priorité"), them: l("Yes", "Oui") },
      { feature: l("Entry price", "Prix d'entrée"), loglead: l("Free, then €29/mo", "Gratuit, puis 29 €/mois"), them: l("Paid plans only", "Offres payantes uniquement") },
    ],
    whyLoglead: [
      l("LogLead builds warm pipeline from LinkedIn engagement instead of cold-email volume.", "LogLead construit un pipeline chaud à partir de l'engagement LinkedIn plutôt que du volume de cold email."),
      l("Content, market intelligence and lead detection live in one platform.", "Contenu, veille marché et détection de leads dans une seule plateforme."),
      l("Leads are scored by intent and enriched automatically.", "Les leads sont scorés par intention et enrichis automatiquement."),
      l("AI visibility (GEO) tracking covers a channel cold-email tools ignore.", "Le suivi de visibilité IA (GEO) couvre un canal que les outils de cold email ignorent."),
    ],
    whenThem: [
      l("Cold email volume and deliverability are your core growth channel.", "Le volume de cold email et la délivrabilité sont ton canal de croissance principal."),
      l("You need many sending inboxes with warm-up and rotation.", "Tu as besoin de nombreuses boîtes d'envoi avec warm-up et rotation."),
    ],
    faq: [
      { q: l("Is LogLead an Instantly alternative?", "LogLead est-il une alternative à Instantly ?"), a: l("Yes, for teams that prefer LinkedIn content and warm engagement leads over high-volume cold email. Instantly is stronger for cold-email sending at scale.", "Oui, pour les équipes qui préfèrent le contenu LinkedIn et les leads chauds via engagement au cold email à fort volume. Instantly est plus fort pour l'envoi de cold email à grande échelle.") },
      { q: l("Does LogLead send cold email?", "LogLead envoie-t-il du cold email ?"), a: l("No — LogLead focuses on LinkedIn content, market intelligence and warm-lead detection. For high-volume cold email, Instantly is a better fit.", "Non — LogLead se concentre sur le contenu LinkedIn, la veille marché et la détection de leads chauds. Pour le cold email à fort volume, Instantly est plus adapté.") },
      { q: l("How does LogLead generate leads then?", "Comment LogLead génère-t-il des leads alors ?"), a: l("It detects and scores the people who engage with your LinkedIn posts, and enriches them with email and phone.", "Il détecte et score les personnes qui interagissent avec tes posts LinkedIn, et les enrichit avec email et téléphone.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — LogLead starts free with 100 credits, no credit card required.", "Oui — LogLead démarre gratuitement avec 100 crédits, sans carte bancaire.") },
      { q: l("Can I use both?", "Puis-je utiliser les deux ?"), a: l("Some teams pair LinkedIn content and warm leads (LogLead) with cold email sending (Instantly). They cover different channels.", "Certaines équipes associent contenu LinkedIn et leads chauds (LogLead) à l'envoi de cold email (Instantly). Ils couvrent des canaux différents.") },
    ],
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

export const VS_SLUGS = COMPETITORS.filter((c) => c.hasVs).map((c) => c.slug);
export const ALTERNATIVE_SLUGS = COMPETITORS.filter((c) => c.hasAlternative).map((c) => c.slug);
