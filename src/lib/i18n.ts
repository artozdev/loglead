// Lightweight i18n for the B2B repositioning. English is the default; French is
// opt-in via Settings > Appearance. Only strings that have been migrated live
// here — components read them through useLocale().t(key). Untranslated copy
// falls back to its existing (French) literal until migrated.

export type Locale = "en" | "fr";

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
];

type Entry = { en: string; fr: string };

export const MESSAGES: Record<string, Entry> = {
  "common.soon": { en: "Soon", fr: "Bientôt" },

  // ----- Sidebar navigation -----
  "nav.section.create": { en: "Create", fr: "Créer" },
  "nav.section.analyze": { en: "Analyze", fr: "Analyser" },
  "nav.section.dashboard": { en: "Dashboard", fr: "Dashboard" },
  "nav.group.analyse": { en: "Analysis", fr: "Analyse" },
  "nav.group.content": { en: "Content", fr: "Content" },
  "nav.section.understand": { en: "Understand", fr: "Comprendre" },
  "nav.section.acquire": { en: "Acquire", fr: "Acquérir" },
  "nav.section.publish": { en: "Publish", fr: "Publier" },
  "nav.section.analytics": { en: "Analytics", fr: "Analytics" },
  "nav.home": { en: "Home", fr: "Accueil" },
  "nav.logagent": { en: "LogAgent", fr: "LogAgent" },
  "nav.logagent.hint": { en: "Find prospects with AI", fr: "Trouve tes prospects avec l'IA" },
  "nav.leads": { en: "Leads", fr: "Leads" },
  "nav.leads.hint": { en: "All your prospects, found and scored by AI", fr: "Tous tes prospects, trouvés et scorés par l'IA" },
  "nav.contact": { en: "Contact", fr: "Contact" },
  "nav.contact.hint": { en: "Prospects to reach out to + follow-up", fr: "Prospects à contacter + suivi" },
  "nav.growthPartner": { en: "AI Growth Partner", fr: "Partenaire IA" },
  "nav.contentEngine": { en: "Post Generator", fr: "Générateur Post" },
  "nav.calendar": { en: "Content Calendar", fr: "Calendrier éditorial" },
  "nav.linkedinIntelligence": { en: "LinkedIn Intelligence", fr: "LinkedIn Intelligence" },
  "nav.marketIntelligence": { en: "Market", fr: "Market" },
  "nav.linkedinAnalytics": { en: "Analytics", fr: "Analytics" },
  "nav.aiVisibility": { en: "AI Visibility", fr: "Visibilité IA" },
  "nav.pipeline": { en: "Pipeline", fr: "Pipeline" },
  "nav.outreach": { en: "Outreach Engine", fr: "Outreach" },
  "nav.inbox": { en: "Inbox", fr: "Inbox" },

  // Sidebar hover hints
  "nav.home.hint": { en: "Your LinkedIn growth dashboard", fr: "Ton tableau de bord de croissance LinkedIn" },
  "nav.growthPartner.hint": { en: "Your AI that runs your LinkedIn growth", fr: "Ton IA qui pilote ta croissance LinkedIn" },
  "nav.contentEngine.hint": { en: "Generate LinkedIn content in seconds", fr: "Génère du contenu LinkedIn en quelques secondes" },
  "nav.calendar.hint": { en: "Plan and schedule your posts", fr: "Planifie et visualise tes publications" },
  "nav.linkedinIntelligence.hint": { en: "How LinkedIn's algorithm works for your market", fr: "Les codes de l'algorithme LinkedIn selon ta niche" },
  "nav.marketIntelligence.hint": { en: "Understand your market and track competitors", fr: "Comprends ton marché et suis tes concurrents" },
  "nav.linkedinAnalytics.hint": { en: "Your real LinkedIn pipeline performance", fr: "Ta performance réelle de pipeline LinkedIn" },
  "nav.aiVisibility.hint": { en: "How you appear across AI search engines", fr: "Comment tu apparais sur les moteurs de recherche IA" },
  "nav.pipeline.hint": { en: "Everyone who engaged with your content", fr: "Centralise et suis tes prospects" },
  "nav.outreach.hint": { en: "Reach out to prospects without leaving the app", fr: "Contacte tes prospects sans quitter l'app" },
  "nav.inbox.hint": { en: "Reach out to prospects without leaving the app", fr: "Contacte tes prospects sans quitter l'app" },

  // ----- Dashboard -----
  "dash.welcome": { en: "Welcome back", fr: "Bon retour" },
  "dash.greeting.morning": { en: "Good morning", fr: "Bonjour" },
  "dash.greeting.afternoon": { en: "Good afternoon", fr: "Bon après-midi" },
  "dash.greeting.evening": { en: "Good evening", fr: "Bonsoir" },
  "dash.subtitleSuffix": { en: "LinkedIn Growth Dashboard", fr: "Dashboard Croissance LinkedIn" },
  "dash.context": {
    en: "Your LinkedIn growth engine is running. Here's your business update.",
    fr: "Ton moteur de croissance LinkedIn tourne. Voici le point sur ton activité.",
  },
  "dash.createContent": { en: "Create content", fr: "Générer du contenu" },
  "dash.empty.title": { en: "Your LinkedIn growth engine is ready.", fr: "Ton moteur de croissance LinkedIn est prêt." },
  "dash.empty.desc": {
    en: "Start by creating your first LinkedIn post. LogLead will detect every decision-maker who engages and build your B2B pipeline automatically.",
    fr: "Commence par créer ton premier post LinkedIn. LogLead détectera chaque décideur qui interagit et construira ton pipeline B2B automatiquement.",
  },
  "dash.empty.cta1": { en: "Create my first post →", fr: "Créer mon premier post →" },
  "dash.empty.cta2": { en: "See my LinkedIn strategy →", fr: "Voir ma stratégie LinkedIn →" },

  // Growth Partner
  "gp.title": { en: "AI Growth Partner", fr: "Partenaire de croissance IA" },
  "gp.open": { en: "Open LogAgent", fr: "Ouvrir LogAgent" },
  "gp.today": { en: "Today's recommendation", fr: "Recommandation du jour" },
  "gp.sendTo": { en: "Send message to {name}", fr: "Envoyer un message à {name}" },
  "gp.seeAll": { en: "See all recommendations →", fr: "Voir toutes les recommandations →" },
  "gp.nextAction": { en: "Next action: {action} ✅", fr: "Prochaine action : {action} ✅" },
  "gp.upsell": { en: "Upgrade to Pro to activate your AI Growth Partner.", fr: "Passe à Pro pour activer ton Partenaire de croissance IA." },
  "gp.upgradePro": { en: "Upgrade to Pro", fr: "Passer à Pro" },

  // Chart
  "chart.impressions": { en: "Impressions", fr: "Impressions" },
  "chart.engagement": { en: "Engagement Rate", fr: "Taux d'engagement" },
  "chart.leads": { en: "Leads Generated", fr: "Leads générés" },
  "dash.liGrowth": { en: "LinkedIn Growth", fr: "Croissance LinkedIn" },
  "dash.weeklyGoal": { en: "Weekly goal: {goal}", fr: "Objectif de la semaine : {goal}" },

  // Content pipeline
  "dash.contentPipeline": { en: "Content Pipeline", fr: "Pipeline de contenu" },
  "dash.scheduledForLi": { en: "Scheduled for LinkedIn", fr: "Planifié pour LinkedIn" },
  "dash.openCalendar": { en: "Open content calendar →", fr: "Ouvrir le calendrier →" },
  "dash.nothingScheduled": { en: "Nothing scheduled. Create your next post.", fr: "Rien de planifié. Crée ton prochain post." },
  "status.ready": { en: "Ready", fr: "Prêt" },
  "status.draft": { en: "Draft", fr: "Brouillon" },

  // Pipeline intelligence
  "dash.pipelineIntel": { en: "Pipeline Intelligence", fr: "Pipeline Intelligence" },
  "dash.pipelineIntel.sub": { en: "Decision-makers who engaged with your LinkedIn content", fr: "Les décideurs qui ont interagi avec ton contenu LinkedIn" },
  "dash.viewAllLeads": { en: "View all", fr: "Tout voir" },
  "dash.pi.qualified": { en: "Qualified", fr: "Qualifiés" },
  "dash.pi.hot": { en: "Hot", fr: "Chauds" },
  "dash.pi.fit": { en: "Fit score", fr: "Score d'affinité" },
  "dash.noLeads": {
    en: "No qualified leads yet. Publish content — prospects who engage will show up here.",
    fr: "Aucun prospect qualifié pour l'instant. Publie du contenu — ceux qui interagissent apparaîtront ici.",
  },
  "dash.intelUpsellDesc": {
    en: "Unlock tracking of the prospects who engage with your content with the Growth plan.",
    fr: "Débloque le suivi des prospects qui interagissent avec ton contenu avec l'offre Growth.",
  },
  "dash.upgradeGrowth": { en: "Upgrade to Growth", fr: "Passer à Growth" },
  "common.reachOut": { en: "Reach out", fr: "Contacter" },

  // Outreach engine
  "dash.outreach": { en: "Outreach Engine", fr: "Moteur d'outreach" },
  "dash.outreach.sub": { en: "Active conversations", fr: "Conversations actives" },
  "dash.viewAll": { en: "View all →", fr: "Voir tout →" },
  "dash.noConversations": { en: "No active conversations.", fr: "Aucune conversation active." },

  // Metric cards (label + unit + sub + delta; {n} interpolated)
  "card.reach.label": { en: "Total Leads", fr: "Total prospects" },
  "card.reach.unit": { en: "prospects", fr: "prospects" },
  "card.reach.sub": { en: "{hot} hot leads (score > 85)", fr: "{hot} leads chauds (score > 85)" },
  "card.reach.delta": { en: "{d} this month", fr: "{d} ce mois" },
  "card.leads.label": { en: "Qualified Leads", fr: "Leads qualifiés" },
  "card.leads.unit": { en: "this month", fr: "ce mois" },
  "card.leads.sub": { en: "{hot} hot leads (score > 85)", fr: "{hot} hot leads (score > 85)" },
  "card.leads.delta": { en: "{d} vs last month", fr: "{d} vs mois dernier" },
  "card.pipeline.label": { en: "Pipeline Value", fr: "Valeur pipeline" },
  "card.pipeline.unit": { en: "estimated", fr: "estimé" },
  "card.pipeline.sub": { en: "{n} leads in discussion", fr: "{n} leads en discussion" },
  "card.pipeline.delta": { en: "+{amount}€ this month", fr: "+{amount}€ ce mois" },
  "card.score.label": { en: "Content Score", fr: "Score de contenu" },
  "card.score.unit": { en: "avg this week", fr: "moyenne 7j" },
  "card.score.sub": { en: "{n} posts published this month", fr: "{n} posts publiés ce mois" },
  "card.visibility.label": { en: "AI Visibility", fr: "Visibilité IA" },
  "card.visibility.unit": { en: "GEO score", fr: "score GEO" },
  "card.visibility.sub": { en: "ChatGPT · Claude · Gemini · Perplexity", fr: "ChatGPT · Claude · Gemini · Perplexity" },
  "card.visibility.delta": { en: "{d} pts", fr: "{d} pts" },

  // Lead buying signals (by score tier)
  "signal.hot": { en: "Liked + commented your last 3 LinkedIn posts", fr: "A liké + commenté tes 3 derniers posts LinkedIn" },
  "signal.warm": { en: "Commented on your recent LinkedIn post", fr: "A commenté ton dernier post LinkedIn" },
  "signal.cool": { en: "Viewed your profile after your post", fr: "A vu ton profil après ton post" },

  // Growth Partner recommendation (interpolated)
  "gp.rec": {
    en: "{name} (score {score}/100) engaged with your last 3 LinkedIn posts. This is the best moment to reach out — their interest is at its peak. I've prepared a personalized message for you.",
    fr: "{name} (score {score}/100) a interagi avec tes 3 derniers posts LinkedIn. C'est le meilleur moment pour le contacter — son intérêt est à son maximum. J'ai préparé un message personnalisé pour toi.",
  },
  "gp.recEmpty": {
    en: "Publish your first LinkedIn post — I'll detect who engages, build your pipeline, and tell you who to reach out to first.",
    fr: "Publie ton premier post LinkedIn — je détecterai qui interagit, construirai ton pipeline et te dirai qui contacter en priorité.",
  },
  "gp.nextPost": { en: "LinkedIn post scheduled for {day} {month} at {time}", fr: "Post LinkedIn planifié le {day} {month} à {time}" },

  // ----- Post Generator (ex Studio) -----
  "postgen.title": { en: "Post Generator", fr: "Générateur Post" },
  "postgen.subtitle": { en: "LinkedIn content that converts — written by AI, signed by you.", fr: "Du contenu LinkedIn qui convertit — écrit par l'IA, signé par toi." },
  "postgen.editor": { en: "Classic editor", fr: "Éditeur classique" },
  "postgen.step1": { en: "Write your post", fr: "Écris ton post" },
  "postgen.result": { en: "Generated result", fr: "Résultat généré" },
  "postgen.forLinkedin": { en: "Generated for LinkedIn", fr: "Généré pour LinkedIn" },
  "postgen.placeholder": { en: "One sentence. LogLead does the rest.", fr: "Une phrase. LogLead s'occupe du reste." },
  "postgen.improve": { en: "Improve with AI", fr: "Améliorer avec l'IA" },
  "postgen.lang": { en: "Language", fr: "Langue" },
  "postgen.generate": { en: "Generate my LinkedIn post", fr: "Générer mon post LinkedIn" },
  "postgen.generating": { en: "Generating…", fr: "Génération…" },
  "postgen.copy": { en: "Copy", fr: "Copier" },
  "postgen.copied": { en: "Copied", fr: "Copié" },
  "postgen.otherAngle": { en: "Other angle", fr: "Autre angle" },
  "postgen.regenerate": { en: "Regenerate", fr: "Régénérer" },
  "postgen.preview": { en: "LinkedIn preview", fr: "Aperçu LinkedIn" },
  "postgen.previewEmpty": { en: "Your LinkedIn preview will appear here as you write.", fr: "Votre aperçu LinkedIn apparaîtra ici au fil de votre rédaction." },
  "postgen.seeMore": { en: "See more", fr: "Voir plus" },
  "postgen.role": { en: "Founder · {saas}", fr: "Fondateur · {saas}" },
  "postgen.now": { en: "1st · Now", fr: "1er · À l'instant" },
  "postgen.chars": { en: "{n} / 3000 characters", fr: "{n} / 3000 caractères" },
  "postgen.len.ideal": { en: "Ideal length", fr: "Longueur idéale" },
  "postgen.len.short": { en: "A bit short", fr: "Un peu court" },
  "postgen.len.long": { en: "Too long", fr: "Trop long" },
  "postgen.tool.expand": { en: "Expand", fr: "Développer" },
  "postgen.tool.hook": { en: "Stronger hook", fr: "Hook plus fort" },
  "postgen.tool.concise": { en: "Make it concise", fr: "Raccourcir" },
  "postgen.tool.optimise": { en: "Optimize for LinkedIn", fr: "Optimiser pour LinkedIn" },
  "postgen.tool.grammar": { en: "Fix grammar", fr: "Corriger la grammaire" },
  "postgen.tool.punchy": { en: "More punchy", fr: "Plus percutant" },
  // Schedule + history
  "postgen.schedule": { en: "Schedule", fr: "Programmer" },
  "postgen.scheduleOn": { en: "Schedule on LinkedIn", fr: "Programmer sur LinkedIn" },
  "postgen.scheduleTitle": { en: "Add to editorial calendar", fr: "Ajouter au calendrier éditorial" },
  "postgen.oneClick": { en: "In one click", fr: "En 1 clic" },
  "postgen.today18": { en: "Today · 6:00 PM", fr: "Aujourd'hui · 18h" },
  "postgen.tomorrow8": { en: "Tomorrow · 8:00 AM", fr: "Demain · 8h" },
  "postgen.tomorrow12": { en: "Tomorrow · 12:00 PM", fr: "Demain · 12h" },
  "postgen.optimal": { en: "Next optimal slot", fr: "Prochain créneau optimal" },
  "postgen.orPickDate": { en: "Or pick a date & time", fr: "Ou choisis date & heure" },
  "postgen.confirmSchedule": { en: "Schedule this post", fr: "Programmer ce post" },
  "postgen.saveDraft": { en: "Save as draft", fr: "Enregistrer en brouillon" },
  "postgen.scheduledOk": { en: "Post scheduled 🎉", fr: "Post programmé 🎉" },
  "postgen.draftSavedOk": { en: "Saved to drafts", fr: "Enregistré en brouillon" },
  "postgen.viewCalendar": { en: "View in calendar", fr: "Voir le calendrier" },
  "postgen.scheduleErr": { en: "Could not schedule. Retry.", fr: "Programmation impossible. Réessaie." },
  "postgen.history": { en: "Post history", fr: "Historique des posts" },
  "postgen.historyEmpty": { en: "No posts yet. Your generated posts show up here.", fr: "Aucun post pour l'instant. Tes posts générés apparaissent ici." },
  "postgen.loadPost": { en: "Open", fr: "Ouvrir" },
  "postgen.statusDraft": { en: "Draft", fr: "Brouillon" },
  "postgen.statusScheduled": { en: "Scheduled", fr: "Programmé" },
  "postgen.statusPublished": { en: "Published", fr: "Publié" },

  // ----- AI Growth Agent (LogAgent) -----
  "agent.morning": { en: "Good morning", fr: "Bonjour" },
  "agent.afternoon": { en: "Good afternoon", fr: "Bon après-midi" },
  "agent.evening": { en: "Good evening", fr: "Bonsoir" },
  "agent.growPrompt": { en: "What would you like to grow today?", fr: "Que veux-tu faire grandir aujourd'hui ?" },
  "agent.credits": { en: "{used} / {quota} credits this month", fr: "{used} / {quota} crédits ce mois" },
  "agent.newConversation": { en: "New conversation", fr: "Nouvelle conversation" },
  "agent.history": { en: "History", fr: "Historique" },
  "agent.suggest.prospects": { en: "Find my ideal prospects", fr: "Trouver mes prospects idéaux" },
  "agent.suggest.strategy": { en: "Build my outreach strategy", fr: "Définir ma stratégie d'acquisition" },
  "agent.suggest.message": { en: "Write a personalized message", fr: "Écrire un message personnalisé" },
  "agent.suggest.pipeline": { en: "Analyze my pipeline", fr: "Analyser mon pipeline" },

  // ----- Onboarding: organization type -----
  "onboarding.orgType.q": { en: "What best describes your organization?", fr: "Qu'est-ce qui décrit le mieux ton organisation ?" },
  "org.startup": { en: "Startup / Scale-up", fr: "Startup / Scale-up" },
  "org.smb": { en: "SMB (10-200 employees)", fr: "PME (10-200 employés)" },
  "org.midmarket": { en: "Mid-Market (200-1000 employees)", fr: "Mid-Market (200-1000 employés)" },
  "org.sales": { en: "Sales team / Individual contributor", fr: "Équipe commerciale / Contributeur" },
  "org.agency": { en: "Agency / Consulting firm", fr: "Agence / Cabinet de conseil" },
  "org.solo": { en: "Solopreneur / Freelancer", fr: "Solopreneur / Freelance" },

  // ----- Settings > Appearance -----
  "settings.appearance": { en: "Appearance", fr: "Apparence" },
  "settings.theme": { en: "Theme", fr: "Thème" },
  "settings.language": { en: "Language", fr: "Langue" },
  "settings.language.desc": {
    en: "Choose your interface language. Applies across the app.",
    fr: "Choisis la langue de l'interface. S'applique à toute l'application.",
  },
};

export type Vars = Record<string, string | number>;

export function translate(key: string, locale: Locale, vars?: Vars): string {
  const entry = MESSAGES[key];
  let s = entry ? entry[locale] ?? entry.en : key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

// Server-side locale from the cookie (default English). Small local parser so
// server components / data builders can localize without pulling in next/headers
// at the call site.
export function localeFromCookie(cookie: string | undefined | null): Locale {
  if (cookie && /(?:^|;\s*)loglead-lang=fr(?:;|$)/.test(cookie)) return "fr";
  return "en";
}
