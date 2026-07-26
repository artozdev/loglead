import type { ContentType } from "./types";

// Bibliothèque de techniques de mise en avant SaaS (Studio — Fonctionnalité C).
// 30 techniques prêtes à l'emploi pour promouvoir un SaaS en organique sans
// avoir l'air de faire de la pub. `example` est un angle concret, adapté à la
// niche du founder via les placeholders {{saas}} / {{icp}} / {{niche}}.
// Le bouton "Générer un contenu avec cette technique" envoie cet angle au brief.

export type TechniqueCategory =
  | "proof"
  | "build_public"
  | "education"
  | "stance"
  | "community"
  | "conversion";

export const TECHNIQUE_CATEGORIES: {
  value: TechniqueCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "proof", label: "Preuve & résultats", emoji: "📊" },
  { value: "build_public", label: "Build in public", emoji: "🛠️" },
  { value: "education", label: "Éducation & expertise", emoji: "🎓" },
  { value: "stance", label: "Prise de position", emoji: "🎯" },
  { value: "community", label: "Communauté & social proof", emoji: "🤝" },
  { value: "conversion", label: "Conversion douce", emoji: "🧲" },
];

export type Technique = {
  id: string;
  category: TechniqueCategory;
  title: string;
  description: string;
  example: string;
  contentType: ContentType;
};

export type Brand = { saas: string; icp: string; niche: string };

export function fillTemplate(str: string, brand: Brand): string {
  return str
    .replaceAll("{{saas}}", brand.saas || "ton SaaS")
    .replaceAll("{{icp}}", brand.icp || "ton audience cible")
    .replaceAll("{{niche}}", brand.niche || "ta niche");
}

export const TECHNIQUES: Technique[] = [
  // ----- Preuve & résultats -------------------------------------------------
  {
    id: "before-after",
    category: "proof",
    title: "Le before/after",
    description: "Montre le problème vécu, puis l'état d'après une fois ton SaaS en place.",
    example: "Montre concrètement ce que {{saas}} change : la galère « avant » de {{icp}}, puis le « après » (sans inventer de chiffres).",
    contentType: "linkedin_post",
  },
  {
    id: "surprising-number",
    category: "proof",
    title: "Le chiffre surprenant",
    description: "Une statistique forte sur le problème que tu résous, pour stopper le scroll.",
    example: "Ouvre sur un chiffre surprenant du problème que {{saas}} résout pour {{icp}}, puis explique ce qu'il révèle.",
    contentType: "linkedin_post",
  },
  {
    id: "mini-case-study",
    category: "proof",
    title: "La mini étude de cas",
    description: "Un usage concret : situation → ce qui a été mis en place → résultat qualitatif.",
    example: "Raconte comment un·e {{icp}} utilise {{saas}} : son problème, l'approche, le nouvel état (qualitatif).",
    contentType: "linkedin_post",
  },
  {
    id: "demo-in-context",
    category: "proof",
    title: "La démo en situation",
    description: "Montre une feature en action sur un cas réel de ta niche, pas un tour de l'UI.",
    example: "Filme/décris {{saas}} qui résout une tâche précise de {{icp}} en quelques secondes, du problème au résultat.",
    contentType: "reel_script",
  },
  {
    id: "indirect-testimonial",
    category: "proof",
    title: "Le témoignage indirect",
    description: "Relaie un retour client sans citer de nom, pour crédibiliser sans vendre.",
    example: "Partage une phrase marquante d'un·e {{icp}} sur {{saas}}, et ce qu'elle dit du vrai problème de {{niche}}.",
    contentType: "linkedin_post",
  },

  // ----- Build in public ----------------------------------------------------
  {
    id: "build-in-public",
    category: "build_public",
    title: "Le build in public",
    description: "Montre les coulisses de ton build — les founders qui buildent en public engagent bien plus.",
    example: "Partage ce que tu as appris en construisant {{saas}} ce mois-ci, et 1-2 décisions que tu ne referais pas.",
    contentType: "linkedin_post",
  },
  {
    id: "share-metrics",
    category: "build_public",
    title: "Les metrics partagés",
    description: "Partage une métrique réelle (sans fard) et la leçon derrière.",
    example: "Dévoile une metric de {{saas}} et ce qu'elle t'a appris sur les besoins de {{icp}}.",
    contentType: "linkedin_post",
  },
  {
    id: "product-decision",
    category: "build_public",
    title: "La décision produit",
    description: "Explique un choix produit difficile et le raisonnement derrière.",
    example: "Explique pourquoi tu as ajouté (ou supprimé) une feature de {{saas}} pour mieux servir {{icp}}.",
    contentType: "linkedin_post",
  },
  {
    id: "lesson-from-failure",
    category: "build_public",
    title: "L'échec qui m'a appris",
    description: "Un raté assumé et la leçon contre-intuitive — Reddit/LinkedIn adorent l'honnêteté.",
    example: "Raconte un échec sur {{saas}} (lancement, feature, canal) et la leçon que {{icp}} peut en tirer.",
    contentType: "linkedin_post",
  },
  {
    id: "open-roadmap",
    category: "build_public",
    title: "La roadmap ouverte",
    description: "Implique ta communauté en partageant ce qui arrive, et demande des avis.",
    example: "Présente 2-3 chantiers à venir sur {{saas}} et demande à {{icp}} lequel prioriser.",
    contentType: "linkedin_post",
  },

  // ----- Éducation & expertise ---------------------------------------------
  {
    id: "mini-tutorial",
    category: "education",
    title: "Le mini-tutoriel",
    description: "Montre comment réaliser une tâche utile avec ton SaaS en 60 secondes.",
    example: "Montre comment {{icp}} fait une tâche précise avec {{saas}} en 60 s, étape par étape, à l'écran.",
    contentType: "reel_script",
  },
  {
    id: "framework",
    category: "education",
    title: "Le framework",
    description: "Offre une méthode claire et réutilisable que ton produit incarne.",
    example: "Présente un framework en 3 étapes pour résoudre le problème de {{icp}}, que {{saas}} applique nativement.",
    contentType: "linkedin_post",
  },
  {
    id: "myth-vs-reality",
    category: "education",
    title: "Mythe vs réalité",
    description: "Casse une idée reçue de ta niche, preuve à l'appui.",
    example: "Démonte un mythe répandu dans {{niche}} et explique la réalité que {{icp}} ignore.",
    contentType: "linkedin_post",
  },
  {
    id: "common-mistake",
    category: "education",
    title: "L'erreur n°1",
    description: "Pointe une erreur fréquente de ton ICP et donne le correctif.",
    example: "Décris l'erreur n°1 que font les {{icp}}, pourquoi elle coûte cher, et comment la corriger.",
    contentType: "linkedin_post",
  },
  {
    id: "actionable-checklist",
    category: "education",
    title: "La checklist actionnable",
    description: "Une liste concrète à appliquer tout de suite, offerte en lead magnet possible.",
    example: "Donne une checklist en 5 points pour que {{icp}} règle [problème] — {{saas}} en automatise une partie.",
    contentType: "linkedin_post",
  },

  // ----- Prise de position --------------------------------------------------
  {
    id: "contrarian-opinion",
    category: "stance",
    title: "L'opinion contrarian",
    description: "Une position tranchée et défendable qui crée la conversation.",
    example: "Prends le contre-pied d'une croyance de {{niche}}, défends-la avec 2 arguments, et nuance honnêtement.",
    contentType: "linkedin_post",
  },
  {
    id: "uncomfortable-question",
    category: "stance",
    title: "La question qui dérange",
    description: "Questionne une pratique commune de ta niche pour faire réfléchir.",
    example: "Pose à {{icp}} une question dérangeante sur une pratique courante de {{niche}}, puis ouvre le débat.",
    contentType: "linkedin_post",
  },
  {
    id: "stop-doing-this",
    category: "stance",
    title: "Arrête de faire ça",
    description: "Dénonce une pratique répandue mais inefficace, et propose mieux.",
    example: "Dis à {{icp}} d'arrêter une pratique inefficace de {{niche}}, explique pourquoi, et propose l'alternative.",
    contentType: "linkedin_post",
  },
  {
    id: "why-we-chose",
    category: "stance",
    title: "Pourquoi on a choisi X",
    description: "Assume un choix de positionnement qui te différencie des concurrents.",
    example: "Explique un parti pris fort de {{saas}} (ce que vous refusez de faire) et pourquoi {{icp}} y gagne.",
    contentType: "linkedin_post",
  },
  {
    id: "manifesto",
    category: "stance",
    title: "Le manifeste",
    description: "Affirme ta vision du futur de ta niche en quelques lignes fortes.",
    example: "Écris le manifeste de {{saas}} : la vision que tu défends pour {{niche}} et le monde d'après.",
    contentType: "linkedin_post",
  },

  // ----- Communauté & social proof -----------------------------------------
  {
    id: "credibility-first",
    category: "community",
    title: "Crédibilité d'abord (Reddit)",
    description: "Réponds à des questions de ta niche sans citer ton SaaS — construis la confiance d'abord.",
    example: "Réponds en profondeur à une vraie question de {{icp}} dans {{niche}}, sans mentionner {{saas}}.",
    contentType: "linkedin_post",
  },
  {
    id: "celebrate-user",
    category: "community",
    title: "Mets un user en lumière",
    description: "Célèbre publiquement un·e utilisateur·rice et son résultat.",
    example: "Mets en avant un·e {{icp}} qui réussit avec {{saas}}, et ce que sa démarche peut inspirer.",
    contentType: "linkedin_post",
  },
  {
    id: "ugc-reaction",
    category: "community",
    title: "Le retour client commenté",
    description: "Réagis publiquement à un feedback (positif ou critique) avec transparence.",
    example: "Partage un retour reçu sur {{saas}} et ce que tu en fais concrètement pour {{icp}}.",
    contentType: "linkedin_post",
  },
  {
    id: "ama",
    category: "community",
    title: "L'AMA / partage d'apprentissages",
    description: "Ouvre une session questions-réponses sur ton parcours et ton produit.",
    example: "Lance un AMA : invite {{icp}} à te poser leurs questions sur {{niche}} et la construction de {{saas}}.",
    contentType: "linkedin_post",
  },
  {
    id: "poll",
    category: "community",
    title: "Le sondage qui engage",
    description: "Pose une question binaire à ta niche pour générer de l'interaction.",
    example: "Propose à {{icp}} un sondage sur un dilemme courant de {{niche}}, puis commente les résultats.",
    contentType: "linkedin_post",
  },

  // ----- Conversion douce ---------------------------------------------------
  {
    id: "soft-lead-magnet",
    category: "conversion",
    title: "Le lead magnet",
    description: "Offre une ressource utile contre un simple commentaire/DM.",
    example: "Offre à {{icp}} une ressource (template, guide) liée au problème que {{saas}} résout, contre un commentaire.",
    contentType: "linkedin_post",
  },
  {
    id: "honest-comparison",
    category: "conversion",
    title: "Le comparatif honnête",
    description: "Compare les approches du marché avec transparence, sans dénigrer.",
    example: "Compare honnêtement les façons de résoudre [problème] dans {{niche}}, et où se place {{saas}}.",
    contentType: "linkedin_post",
  },
  {
    id: "how-we-help",
    category: "conversion",
    title: "Comment on aide concrètement",
    description: "Explique le « comment » de ta valeur, pas seulement le « quoi ».",
    example: "Décris pas à pas comment {{saas}} fait gagner du temps à {{icp}} sur une situation précise.",
    contentType: "linkedin_post",
  },
  {
    id: "soft-trial",
    category: "conversion",
    title: "L'invitation à l'essai",
    description: "Propose un essai/démo de façon non-vendeuse, ancrée dans un bénéfice.",
    example: "Invite {{icp}} à tester {{saas}} sur un cas concret, avec une promesse claire et une action unique.",
    contentType: "linkedin_post",
  },
  {
    id: "objection-faq",
    category: "conversion",
    title: "La FAQ qui lève l'objection",
    description: "Réponds publiquement à l'objection n°1 qui freine ton ICP.",
    example: "Traite l'objection la plus fréquente de {{icp}} avant d'acheter {{saas}}, avec honnêteté.",
    contentType: "linkedin_post",
  },
];
