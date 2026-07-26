import type { Template } from "./types";

// Curated starter catalog (kept intentionally small for the MVP).
// Static & read-only here; productionizing would move these into a DB table.
// Each "Adapter à mon profil" action sends the structure through the Studio so
// Claude personalizes it with the founder's profile.

export const TEMPLATES: Template[] = [
  // ----- LinkedIn · Storytelling -----
  {
    id: "li-story-origin",
    category: "linkedin_storytelling",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "L'histoire d'origine",
    description: "Raconte le moment déclencheur qui a mené à ton produit.",
    structure:
      "Hook : un moment précis et personnel.\nContexte : le problème vécu.\nDéclic : ce que tu as compris.\nRésolution : comment {{produit}} en est né.\nCTA : invite à la discussion.",
  },
  {
    id: "li-story-failure",
    category: "linkedin_storytelling",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "L'échec qui a tout changé",
    description: "Une erreur coûteuse et la leçon qui en a découlé.",
    structure:
      "Hook : « J'ai perdu {{quelque chose} en faisant X. »\nLe contexte de l'échec.\nLa leçon contre-intuitive.\nCe que tu fais différemment aujourd'hui.\nCTA.",
  },
  {
    id: "li-story-day-in-life",
    category: "linkedin_storytelling",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Une journée dans la vie",
    description: "Montre les coulisses d'un founder qui construit.",
    structure:
      "Hook : une scène concrète du quotidien.\n3 moments clés de la journée.\nCe que ça révèle sur {{ta mission}}.\nCTA.",
  },
  {
    id: "li-story-mentor",
    category: "linkedin_storytelling",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Le conseil qui m'a marqué",
    description: "Un conseil reçu, recontextualisé pour ton audience.",
    structure:
      "Hook : « La meilleure leçon qu'on m'ait donnée. »\nQui te l'a dit, dans quel contexte.\nPourquoi ça change tout pour {{ICP}}.\nCTA.",
  },

  // ----- LinkedIn · Contrarian take -----
  {
    id: "li-contra-myth",
    category: "linkedin_contrarian",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Le mythe à déconstruire",
    description: "Attaque une croyance répandue de ton marché.",
    structure:
      "Hook : « Tout le monde croit X. C'est faux. »\nPourquoi c'est faux.\nLa vraie réponse.\nCe que ça implique pour {{ICP}}.\nCTA.",
  },
  {
    id: "li-contra-unpopular",
    category: "linkedin_contrarian",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Opinion impopulaire",
    description: "Une prise de position assumée et défendable.",
    structure:
      "Hook : « Opinion impopulaire : … »\nTon argument principal.\n2 preuves ou exemples.\nNuance honnête.\nCTA : demande l'avis.",
  },
  {
    id: "li-contra-stop-doing",
    category: "linkedin_contrarian",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Arrête de faire ça",
    description: "Dénonce une pratique courante mais inefficace.",
    structure:
      "Hook : « Arrête de {{pratique courante}}. »\nPourquoi ça ne marche pas.\nQuoi faire à la place.\nCTA.",
  },

  // ----- LinkedIn · Liste -----
  {
    id: "li-list-lessons",
    category: "linkedin_list",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "X leçons en Y temps",
    description: "Liste condensée d'apprentissages.",
    structure:
      "Hook : « {{N}} leçons apprises en {{durée}}. »\nListe de {{N}} points courts et actionnables.\nLe point bonus.\nCTA.",
  },
  {
    id: "li-list-tools",
    category: "linkedin_list",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Ma stack en X outils",
    description: "Partage des outils, dont le tien, sans forcer.",
    structure:
      "Hook : « Les {{N}} outils qui font tourner {{activité}}. »\nListe avec 1 ligne de valeur chacun (dont {{produit}}).\nCTA.",
  },
  {
    id: "li-list-mistakes",
    category: "linkedin_list",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "X erreurs à éviter",
    description: "Liste d'erreurs fréquentes de ton ICP.",
    structure:
      "Hook : « {{N}} erreurs que font 90% des {{ICP}}. »\nListe des erreurs + correctif.\nCTA.",
  },
  {
    id: "li-list-steps",
    category: "linkedin_list",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "La méthode en X étapes",
    description: "Un process clair, étape par étape.",
    structure:
      "Hook : « Comment {{résultat}} en {{N}} étapes. »\nÉtapes numérotées.\nLe piège à éviter.\nCTA.",
  },

  // ----- LinkedIn · Étude de cas -----
  {
    id: "li-case-before-after",
    category: "linkedin_case_study",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Avant / Après",
    description: "Transformation concrète (sans inventer de chiffres).",
    structure:
      "Hook : la situation initiale.\nAvant : les symptômes du problème.\nL'intervention : ce qui a été mis en place.\nAprès : le nouvel état (qualitatif).\nCTA.",
  },
  {
    id: "li-case-problem-solution",
    category: "linkedin_case_study",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Problème → Solution",
    description: "Décris un problème client et comment tu le résous.",
    structure:
      "Hook : un problème très spécifique de {{ICP}}.\nPourquoi il est si coûteux.\nL'approche de {{produit}}.\nLe résultat attendu.\nCTA.",
  },
  {
    id: "li-case-teardown",
    category: "linkedin_case_study",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Le teardown",
    description: "Analyse un cas/exemple et tire-en des enseignements.",
    structure:
      "Hook : « J'ai décortiqué {{exemple}}. »\n3 enseignements.\nCe que {{ICP}} peut appliquer dès demain.\nCTA.",
  },

  // ----- Reels / TikTok · Hook -----
  {
    id: "reel-pov",
    category: "reel_hook",
    platform: "tiktok",
    contentType: "reel_script",
    title: "POV",
    description: "Mise en situation immersive à la première personne.",
    structure:
      "Hook (0-3s) : « POV : tu es {{ICP}} et … »\nDéveloppement : le problème puis le déclic.\nDémonstration rapide de {{produit}}.\nCTA : « Suis pour la suite. »",
  },
  {
    id: "reel-3-tips",
    category: "reel_hook",
    platform: "tiktok",
    contentType: "reel_script",
    title: "3 astuces en 30s",
    description: "Format rapide et à forte rétention.",
    structure:
      "Hook : « 3 façons de {{résultat}} sans {{contrainte}}. »\nAstuce 1, 2, 3 (1 phrase chacune).\nCTA : « Enregistre pour plus tard. »",
  },
  {
    id: "reel-mistake",
    category: "reel_hook",
    platform: "tiktok",
    contentType: "reel_script",
    title: "L'erreur n°1",
    description: "Pointe une erreur et corrige-la en quelques secondes.",
    structure:
      "Hook : « L'erreur n°1 des {{ICP}}. »\nMontre l'erreur.\nMontre le correctif.\nCTA.",
  },
  {
    id: "reel-before-after",
    category: "reel_hook",
    platform: "tiktok",
    contentType: "reel_script",
    title: "Avant / Après (vidéo)",
    description: "Transformation visuelle rythmée.",
    structure:
      "Hook : l'état « avant » exagéré.\nTransition.\nL'état « après » avec {{produit}}.\nCTA.",
  },
  {
    id: "reel-myth",
    category: "reel_hook",
    platform: "instagram",
    contentType: "reel_script",
    title: "Mythe vs Réalité",
    description: "Casse une idée reçue face caméra.",
    structure:
      "Hook : « Mythe : {{croyance}}. »\nRéalité : la vérité.\nPreuve rapide.\nCTA.",
  },

  // ----- Lead magnets -----
  {
    id: "lead-checklist",
    category: "lead_magnet",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Checklist",
    description: "Une checklist actionnable à offrir contre un commentaire.",
    structure:
      "Hook : « La checklist {{thème}} en {{N}} points. »\nLes points de la checklist.\nCTA : « Commente {{MOT}} pour la recevoir. »",
  },
  {
    id: "lead-mini-guide",
    category: "lead_magnet",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Mini-guide",
    description: "Le sommaire d'un guide court, offert en lead magnet.",
    structure:
      "Hook : la promesse du guide.\nCe qu'il contient (3-5 sections).\nÀ qui il s'adresse ({{ICP}}).\nCTA pour le télécharger.",
  },
  {
    id: "lead-notion-template",
    category: "lead_magnet",
    platform: "instagram",
    contentType: "instagram_caption",
    title: "Template Notion",
    description: "Présente un template gratuit à récupérer.",
    structure:
      "Hook : le problème que le template résout.\nCe que le template fait gagner.\nCapture/aperçu.\nCTA : « DM {{MOT}} pour le lien. »",
  },
  {
    id: "lead-swipe-file",
    category: "lead_magnet",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Swipe file",
    description: "Une collection d'exemples prêts à réutiliser.",
    structure:
      "Hook : « J'ai compilé {{N}} {{exemples}}. »\nUn aperçu de 2-3 exemples.\nCTA : « Commente pour le fichier complet. »",
  },
  {
    id: "lead-calculator",
    category: "lead_magnet",
    platform: "linkedin",
    contentType: "linkedin_post",
    title: "Calculateur / outil",
    description: "Propose un petit outil utile à ton ICP.",
    structure:
      "Hook : la question chiffrée que se pose {{ICP}}.\nCe que l'outil calcule.\nLe bénéfice.\nCTA pour y accéder.",
  },
];
