// Data for the vertical /for/<slug> pages. Bilingual (en/fr). Honest and
// capability-based — no fabricated metrics or fake testimonials.

export type L = { en: string; fr: string };

export type Vertical = {
  slug: string;
  name: L; // display, e.g. "SaaS founders"
  keyword: string; // primary SEO keyword (English)
  h1: L;
  intro: L;
  ctaLabel: L;
  problem: { title: L; points: L[] };
  solutions: { feature: L; desc: L }[];
  fit: L;
  faq: { q: L; a: L }[];
};

const l = (en: string, fr: string): L => ({ en, fr });

export const VERTICALS: Vertical[] = [
  {
    slug: "saas-founders",
    name: l("SaaS founders", "fondateurs SaaS"),
    keyword: "linkedin lead generation for saas",
    h1: l("LinkedIn lead generation for SaaS founders", "Génération de leads LinkedIn pour fondateurs SaaS"),
    intro: l(
      "Turn LinkedIn into your #1 acquisition channel — without a marketing team. LogLead finds warm prospects, writes content in your voice and tracks your AI visibility.",
      "Fais de LinkedIn ton canal d'acquisition n°1 — sans équipe marketing. LogLead trouve des prospects chauds, écrit du contenu dans ta voix et suit ta visibilité IA.",
    ),
    ctaLabel: l("Generate leads as a founder", "Générer des leads en tant que fondateur"),
    problem: {
      title: l("The founder's distribution problem", "Le problème de distribution du fondateur"),
      points: [
        l("You built the product, but distribution is the real bottleneck — and there's no time for it.", "Tu as construit le produit, mais la distribution est le vrai goulot d'étranglement — et tu n'as pas le temps."),
        l("Cold outreach doesn't fit a product-led motion, and hiring a marketer is expensive and slow.", "Le cold outreach ne colle pas à une approche product-led, et recruter un marketeur est coûteux et lent."),
        l("You know LinkedIn works, but posting consistently and turning engagement into pipeline is manual.", "Tu sais que LinkedIn marche, mais publier régulièrement et transformer l'engagement en pipeline est manuel."),
        l("You have no visibility into what your market is talking about before you write.", "Tu n'as aucune visibilité sur ce dont parle ton marché avant d'écrire."),
      ],
    },
    solutions: [
      { feature: l("Content in your voice", "Du contenu dans ta voix"), desc: l("LogLead learns from your real posts and generates LinkedIn content that sounds like you — not generic AI. Distribution without the daily grind.", "LogLead apprend de tes vrais posts et génère du contenu LinkedIn qui te ressemble — pas une IA générique. La distribution sans la corvée quotidienne.") },
      { feature: l("Warm leads from engagement", "Leads chauds via l'engagement"), desc: l("It detects and scores the people who react and comment on your posts, then enriches their email and phone. Warm intent, not cold lists.", "Il détecte et score les personnes qui réagissent et commentent tes posts, puis enrichit leur email et téléphone. De l'intention chaude, pas des listes froides.") },
      { feature: l("Market intelligence", "Veille marché"), desc: l("See trends, competitor activity and buying signals in your niche so every post lands on what your market actually cares about.", "Vois les tendances, l'activité des concurrents et les signaux d'achat de ta niche pour que chaque post touche ce qui intéresse vraiment ton marché.") },
    ],
    fit: l("A single founder can run market intelligence, content and lead generation from one place — no marketing hire required.", "Un fondateur seul peut piloter veille marché, contenu et génération de leads depuis un seul endroit — sans recrutement marketing."),
    faq: [
      { q: l("Do I need a marketing team to use LogLead?", "Faut-il une équipe marketing pour utiliser LogLead ?"), a: l("No. LogLead is built for founders who do growth themselves — content, warm leads and market intelligence in one guided platform.", "Non. LogLead est conçu pour les fondateurs qui font leur growth eux-mêmes — contenu, leads chauds et veille marché dans une plateforme guidée.") },
      { q: l("Will the content sound like AI?", "Le contenu aura-t-il l'air d'une IA ?"), a: l("No. LogLead learns your voice from your real posts and avoids generic 'AI LinkedIn' patterns, so posts sound like you.", "Non. LogLead apprend ta voix à partir de tes vrais posts et évite les tics du « LinkedIn IA » générique, pour que ça te ressemble.") },
      { q: l("How do I get leads as a SaaS founder?", "Comment obtenir des leads en tant que fondateur SaaS ?"), a: l("Connect your LinkedIn profile and LogLead turns the people engaging with your posts into scored, enriched leads.", "Connecte ton profil LinkedIn et LogLead transforme les personnes qui interagissent avec tes posts en leads scorés et enrichis.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — start free with 100 credits, no credit card required.", "Oui — commence gratuitement avec 100 crédits, sans carte bancaire.") },
    ],
  },
  {
    slug: "agencies",
    name: l("agencies", "agences"),
    keyword: "linkedin lead generation for agencies",
    h1: l("LinkedIn lead generation for agencies", "Génération de leads LinkedIn pour agences"),
    intro: l(
      "Build a predictable pipeline and turn your expertise into content that attracts clients. LogLead handles market intelligence, content and warm-lead detection.",
      "Construis un pipeline prévisible et transforme ton expertise en contenu qui attire les clients. LogLead gère la veille marché, le contenu et la détection de leads chauds.",
    ),
    ctaLabel: l("Generate leads for your agency", "Générer des leads pour ton agence"),
    problem: {
      title: l("The agency pipeline problem", "Le problème de pipeline des agences"),
      points: [
        l("Referrals are great until they dry up — you need a predictable inbound channel.", "Le bouche-à-oreille est génial jusqu'à ce qu'il se tarisse — il te faut un canal inbound prévisible."),
        l("Your team has real expertise, but turning it into consistent content is time-consuming.", "Ton équipe a une vraie expertise, mais la transformer en contenu régulier prend du temps."),
        l("Prospecting by hand across niches doesn't scale as you take on more clients.", "Prospecter à la main sur plusieurs niches ne passe pas à l'échelle quand tu prends plus de clients."),
        l("You need to prove authority to win better retainers.", "Tu dois prouver ton autorité pour décrocher de meilleurs contrats."),
      ],
    },
    solutions: [
      { feature: l("Expertise into content", "L'expertise en contenu"), desc: l("Turn your team's knowledge into LinkedIn content that demonstrates authority and attracts inbound leads — generated in your voice.", "Transforme le savoir de ton équipe en contenu LinkedIn qui démontre ton autorité et attire des leads inbound — généré dans ta voix.") },
      { feature: l("Warm leads, scored", "Leads chauds, scorés"), desc: l("LogLead detects who engages with your content, scores them by intent and enriches their contact details, so your pipeline is predictable.", "LogLead détecte qui interagit avec ton contenu, les score par intention et enrichit leurs coordonnées, pour un pipeline prévisible.") },
      { feature: l("Market intelligence per niche", "Veille marché par niche"), desc: l("Track trends and buying signals across the niches you serve, so your positioning stays sharp.", "Suis les tendances et signaux d'achat des niches que tu sers, pour un positionnement toujours affûté.") },
    ],
    fit: l("Agencies can build authority and a repeatable inbound pipeline instead of relying only on referrals.", "Les agences peuvent bâtir leur autorité et un pipeline inbound reproductible au lieu de dépendre du seul bouche-à-oreille."),
    faq: [
      { q: l("Can LogLead help my agency get more clients?", "LogLead peut-il aider mon agence à avoir plus de clients ?"), a: l("Yes — it turns your expertise into LinkedIn content and converts the resulting engagement into scored, enriched leads.", "Oui — il transforme ton expertise en contenu LinkedIn et convertit l'engagement obtenu en leads scorés et enrichis.") },
      { q: l("Does it work across multiple niches?", "Fonctionne-t-il sur plusieurs niches ?"), a: l("Yes. Market intelligence and content adapt to the niche and audience you configure.", "Oui. La veille marché et le contenu s'adaptent à la niche et à l'audience que tu configures.") },
      { q: l("Can I manage more than one workspace?", "Puis-je gérer plusieurs espaces de travail ?"), a: l("Higher plans support multiple workspaces, which agencies use to separate clients or brands.", "Les offres supérieures gèrent plusieurs espaces de travail, que les agences utilisent pour séparer clients ou marques.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — start free with 100 credits, no credit card required.", "Oui — commence gratuitement avec 100 crédits, sans carte bancaire.") },
    ],
  },
  {
    slug: "consultants",
    name: l("consultants", "consultants"),
    keyword: "linkedin prospecting for consultants",
    h1: l("LinkedIn prospecting for consultants", "Prospection LinkedIn pour consultants"),
    intro: l(
      "Find clients without cold calling. LogLead helps you build authority on LinkedIn and turns the people who engage with your content into warm, qualified leads.",
      "Trouve des clients sans démarchage à froid. LogLead t'aide à bâtir ton autorité sur LinkedIn et transforme les personnes qui interagissent avec ton contenu en leads chauds et qualifiés.",
    ),
    ctaLabel: l("Find clients as a consultant", "Trouver des clients en tant que consultant"),
    problem: {
      title: l("The consultant's client-acquisition problem", "Le problème d'acquisition client du consultant"),
      points: [
        l("Your revenue depends on referrals and word of mouth — unpredictable and hard to scale.", "Ton chiffre dépend des recommandations et du bouche-à-oreille — imprévisible et difficile à scaler."),
        l("Cold calling and cold DMs feel off-brand for a trusted advisor.", "Le démarchage à froid et les DM froids ne collent pas à l'image d'un conseiller de confiance."),
        l("You don't have hours to prospect between client work.", "Tu n'as pas des heures à consacrer à la prospection entre deux missions."),
        l("Your expertise is your best asset, but it's invisible if you don't publish.", "Ton expertise est ton meilleur atout, mais elle est invisible si tu ne publies pas."),
      ],
    },
    solutions: [
      { feature: l("Thought leadership content", "Contenu de thought leadership"), desc: l("LogLead generates content in your voice that positions you as an expert and attracts inbound interest — no cold calling.", "LogLead génère du contenu dans ta voix qui te positionne en expert et attire l'intérêt inbound — sans démarchage à froid.") },
      { feature: l("Warm leads from engagement", "Leads chauds via l'engagement"), desc: l("The people who react and comment on your posts are surfaced as scored leads and enriched with contact data.", "Les personnes qui réagissent et commentent tes posts remontent comme leads scorés et enrichis de coordonnées.") },
      { feature: l("Signals and timing", "Signaux et timing"), desc: l("Know who's showing interest and when to reach out, with a personalized message ready to go.", "Sache qui montre de l'intérêt et quand le contacter, avec un message personnalisé prêt à l'emploi.") },
    ],
    fit: l("Consultants can generate inbound demand from authority content instead of chasing cold prospects.", "Les consultants peuvent générer une demande inbound grâce au contenu d'autorité plutôt que courir après des prospects froids."),
    faq: [
      { q: l("Can I get clients without cold outreach?", "Puis-je avoir des clients sans démarchage à froid ?"), a: l("Yes — LogLead is built around inbound: authority content plus warm leads from the people who engage with you.", "Oui — LogLead est construit autour de l'inbound : contenu d'autorité et leads chauds issus des personnes qui interagissent avec toi.") },
      { q: l("Do I need to post every day?", "Dois-je publier tous les jours ?"), a: l("No. LogLead generates content in your voice so you can stay consistent without the daily effort.", "Non. LogLead génère du contenu dans ta voix pour rester régulier sans l'effort quotidien.") },
      { q: l("How are leads qualified?", "Comment les leads sont-ils qualifiés ?"), a: l("Leads are scored by intent (a comment signals more than a like) and enriched with email and phone.", "Les leads sont scorés par intention (un commentaire signale plus qu'un like) et enrichis avec email et téléphone.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — start free with 100 credits, no credit card required.", "Oui — commence gratuitement avec 100 crédits, sans carte bancaire.") },
    ],
  },
  {
    slug: "sales-teams",
    name: l("sales teams", "équipes commerciales"),
    keyword: "b2b sales prospecting tool",
    h1: l("B2B sales prospecting tool for modern sales teams", "Outil de prospection B2B pour équipes commerciales modernes"),
    intro: l(
      "Give your reps warm, intent-scored leads instead of cold lists. LogLead surfaces prospects showing real interest on LinkedIn and enriches them automatically.",
      "Donne à tes commerciaux des leads chauds scorés par intention plutôt que des listes froides. LogLead fait remonter les prospects qui montrent un vrai intérêt sur LinkedIn et les enrichit automatiquement.",
    ),
    ctaLabel: l("Equip your sales team", "Équiper ton équipe commerciale"),
    problem: {
      title: l("The prospecting problem for sales teams", "Le problème de prospection des équipes commerciales"),
      points: [
        l("Cold lists convert poorly and burn rep time on low-intent contacts.", "Les listes froides convertissent mal et gaspillent le temps des commerciaux sur des contacts peu intéressés."),
        l("Reps lack signal on who is actually interested right now.", "Les commerciaux manquent de signal sur qui est réellement intéressé maintenant."),
        l("Prospecting and enrichment are spread across disconnected tools.", "Prospection et enrichissement sont éparpillés dans des outils déconnectés."),
        l("Content and outbound live in silos, so warm engagement is wasted.", "Contenu et outbound vivent en silos, donc l'engagement chaud est gaspillé."),
      ],
    },
    solutions: [
      { feature: l("Intent-scored leads", "Leads scorés par intention"), desc: l("LogLead scores prospects by real buying signals from LinkedIn engagement, so reps focus on the warmest opportunities first.", "LogLead score les prospects selon de vrais signaux d'achat issus de l'engagement LinkedIn, pour que les commerciaux traitent d'abord les opportunités les plus chaudes.") },
      { feature: l("Automatic enrichment", "Enrichissement automatique"), desc: l("Every lead is enriched with verified email and phone — no manual research.", "Chaque lead est enrichi avec email et téléphone vérifiés — sans recherche manuelle.") },
      { feature: l("Market signals", "Signaux de marché"), desc: l("Detect hiring, launches and other buying signals in your market so reps reach out at the right moment.", "Détecte recrutements, lancements et autres signaux d'achat de ton marché pour contacter au bon moment.") },
    ],
    fit: l("Sales teams spend time on prospects with real intent instead of cold, unqualified lists.", "Les équipes commerciales passent leur temps sur des prospects à vraie intention plutôt que sur des listes froides non qualifiées."),
    faq: [
      { q: l("How is this different from a cold-outreach tool?", "En quoi est-ce différent d'un outil d'outreach froid ?"), a: l("LogLead prioritizes warm, intent-scored leads from LinkedIn engagement over cold lists, and enriches them automatically.", "LogLead privilégie les leads chauds scorés par intention issus de l'engagement LinkedIn plutôt que les listes froides, et les enrichit automatiquement.") },
      { q: l("Does it enrich email and phone?", "Enrichit-il email et téléphone ?"), a: l("Yes — leads are enriched with verified email and phone and scored by intent.", "Oui — les leads sont enrichis avec email et téléphone vérifiés et scorés par intention.") },
      { q: l("Can it detect buying signals?", "Peut-il détecter les signaux d'achat ?"), a: l("Yes — market intelligence surfaces hiring, launches and other signals in your target market.", "Oui — la veille marché fait remonter recrutements, lancements et autres signaux de ton marché cible.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — start free with 100 credits, no credit card required.", "Oui — commence gratuitement avec 100 crédits, sans carte bancaire.") },
    ],
  },
  {
    slug: "startups",
    name: l("startups", "startups"),
    keyword: "b2b growth for startups",
    h1: l("B2B growth for startups, powered by LinkedIn", "Croissance B2B pour startups, propulsée par LinkedIn"),
    intro: l(
      "No ad budget? No problem. LogLead helps startups grow on LinkedIn organically — content in your voice, warm leads and market intelligence, all in one place.",
      "Pas de budget pub ? Pas de problème. LogLead aide les startups à croître organiquement sur LinkedIn — contenu dans ta voix, leads chauds et veille marché, au même endroit.",
    ),
    ctaLabel: l("Grow your startup", "Faire grandir ta startup"),
    problem: {
      title: l("The startup growth problem", "Le problème de croissance des startups"),
      points: [
        l("You need your first customers before you have a budget for paid ads.", "Il te faut tes premiers clients avant d'avoir un budget pour la pub payante."),
        l("Distribution matters more than the product at this stage — and it's hard.", "La distribution compte plus que le produit à ce stade — et c'est difficile."),
        l("You can't afford a full growth team, yet you need consistent output.", "Tu ne peux pas te payer une équipe growth complète, mais il te faut une production régulière."),
        l("Every euro and hour counts, so tools have to work out of the box.", "Chaque euro et chaque heure compte, donc les outils doivent fonctionner prêts à l'emploi."),
      ],
    },
    solutions: [
      { feature: l("Organic LinkedIn growth", "Croissance LinkedIn organique"), desc: l("Generate consistent content in your voice and build an audience without spending on ads.", "Génère du contenu régulier dans ta voix et construis une audience sans dépenser en pub.") },
      { feature: l("Warm leads, no ad spend", "Leads chauds, sans budget pub"), desc: l("Turn the engagement on your posts into scored, enriched leads — a channel that compounds over time.", "Transforme l'engagement de tes posts en leads scorés et enrichis — un canal qui capitalise dans le temps.") },
      { feature: l("Works out of the box", "Prêt à l'emploi"), desc: l("No setup projects or data wiring. Start free with 100 credits and get value in minutes.", "Aucun projet de mise en place ni branchement de données. Commence gratuitement avec 100 crédits et obtiens de la valeur en quelques minutes.") },
    ],
    fit: l("Startups get a compounding organic channel and first customers without paid acquisition.", "Les startups obtiennent un canal organique qui capitalise et leurs premiers clients sans acquisition payante."),
    faq: [
      { q: l("Can I grow without paid ads?", "Puis-je croître sans pub payante ?"), a: l("Yes — LogLead is built for organic LinkedIn growth: content, warm leads and market intelligence, no ad spend required.", "Oui — LogLead est fait pour la croissance LinkedIn organique : contenu, leads chauds et veille marché, sans budget pub.") },
      { q: l("How do I get my first customers?", "Comment obtenir mes premiers clients ?"), a: l("Publish content in your voice and convert the engagement into warm, scored leads you can reach out to.", "Publie du contenu dans ta voix et convertis l'engagement en leads chauds et scorés que tu peux contacter.") },
      { q: l("Is it affordable for a startup?", "Est-ce abordable pour une startup ?"), a: l("Yes — start free with 100 credits, then paid plans from €29/mo.", "Oui — commence gratuitement avec 100 crédits, puis des offres dès 29 €/mois.") },
      { q: l("Do I need technical setup?", "Faut-il une configuration technique ?"), a: l("No — LogLead works out of the box, no data or workflow wiring required.", "Non — LogLead fonctionne prêt à l'emploi, aucun branchement de données ou de workflow requis.") },
    ],
  },
  {
    slug: "b2b-companies",
    name: l("B2B companies", "entreprises B2B"),
    keyword: "b2b lead generation platform",
    h1: l("The B2B lead generation platform for LinkedIn", "La plateforme de génération de leads B2B pour LinkedIn"),
    intro: l(
      "One platform for market intelligence, LinkedIn content, warm-lead detection, enrichment and AI visibility — so your B2B pipeline stops being unpredictable.",
      "Une plateforme pour la veille marché, le contenu LinkedIn, la détection de leads chauds, l'enrichissement et la visibilité IA — pour que ton pipeline B2B cesse d'être imprévisible.",
    ),
    ctaLabel: l("Generate B2B leads", "Générer des leads B2B"),
    problem: {
      title: l("The B2B pipeline problem", "Le problème de pipeline B2B"),
      points: [
        l("Your growth stack is fragmented across six disconnected tools.", "Ta stack de croissance est fragmentée entre six outils déconnectés."),
        l("Pipeline is unpredictable and hard to attribute.", "Le pipeline est imprévisible et difficile à attribuer."),
        l("Cold outreach is getting less effective while buyers research on LinkedIn and AI assistants.", "L'outreach froid perd en efficacité pendant que les acheteurs se renseignent sur LinkedIn et via les assistants IA."),
        l("You lack a single view of content, leads and market signals.", "Il te manque une vue unique du contenu, des leads et des signaux de marché."),
      ],
    },
    solutions: [
      { feature: l("One connected platform", "Une plateforme connectée"), desc: l("Market intelligence, content, lead detection, enrichment and AI visibility in one place — not six tools.", "Veille marché, contenu, détection de leads, enrichissement et visibilité IA au même endroit — pas six outils.") },
      { feature: l("Warm, scored pipeline", "Un pipeline chaud et scoré"), desc: l("Convert LinkedIn engagement into intent-scored, enriched leads for a more predictable pipeline.", "Convertis l'engagement LinkedIn en leads scorés par intention et enrichis, pour un pipeline plus prévisible.") },
      { feature: l("AI visibility (GEO)", "Visibilité IA (GEO)"), desc: l("Track whether ChatGPT, Perplexity and Gemini recommend your company — the channel buyers increasingly use.", "Suis si ChatGPT, Perplexity et Gemini recommandent ton entreprise — un canal de plus en plus utilisé par les acheteurs.") },
    ],
    fit: l("B2B companies replace a fragmented stack with one connected growth platform.", "Les entreprises B2B remplacent une stack fragmentée par une seule plateforme de croissance connectée."),
    faq: [
      { q: l("What does LogLead do for B2B companies?", "Que fait LogLead pour les entreprises B2B ?"), a: l("It combines market intelligence, LinkedIn content, warm-lead detection, enrichment and AI-visibility tracking in one platform.", "Il combine veille marché, contenu LinkedIn, détection de leads chauds, enrichissement et suivi de visibilité IA dans une seule plateforme.") },
      { q: l("How is the pipeline more predictable?", "En quoi le pipeline est-il plus prévisible ?"), a: l("Leads come from real engagement and are scored by intent, so you focus on prospects likely to convert.", "Les leads viennent d'un engagement réel et sont scorés par intention, tu te concentres donc sur les prospects susceptibles de convertir.") },
      { q: l("What is AI visibility (GEO)?", "Qu'est-ce que la visibilité IA (GEO) ?"), a: l("It tracks how AI assistants like ChatGPT and Perplexity describe and recommend your company — an emerging B2B discovery channel.", "Elle suit comment les assistants IA comme ChatGPT et Perplexity décrivent et recommandent ton entreprise — un canal de découverte B2B émergent.") },
      { q: l("Is there a free plan?", "Y a-t-il une offre gratuite ?"), a: l("Yes — start free with 100 credits, no credit card required.", "Oui — commence gratuitement avec 100 crédits, sans carte bancaire.") },
    ],
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}

export const VERTICAL_SLUGS = VERTICALS.map((v) => v.slug);
