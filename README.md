# LogLead

Un studio de contenu IA qui aide les founders de SaaS à transformer leurs
réseaux sociaux en machine à prospects — sans compétences créatives ni temps
illimité.

LogLead génère du contenu personnalisé (posts, scripts, légendes) à partir de
ton profil, ton offre et ton marché, et te donne un calendrier éditorial
prêt à l'emploi.

## Démarrage (zéro configuration)

```bash
npm install
npm run dev
```

Ouvre **http://localhost:3000**. L'app tourne immédiatement en **mode démo** :
le Studio renvoie du contenu d'exemple, donc tu peux tester tout le parcours
(inscription → profil → génération → calendrier) sans aucune clé.

### Activer la génération IA réelle

Copie `.env.local.example` en `.env.local` et renseigne :

```bash
ANTHROPIC_API_KEY=sk-ant-...   # https://console.anthropic.com/
SESSION_SECRET=une-longue-chaîne-aléatoire
```

Avec une clé valide, le Studio utilise **Claude (claude-opus-4-8)** pour générer
du contenu réellement personnalisé selon ton profil et différencié de tes
concurrents.

## Le parcours en moins de 15 minutes

1. **Inscription / connexion** — premier écran.
2. **Onboarding** — ton SaaS, ton offre, ta proposition de valeur, ton ICP, 3
   concurrents, ton de voix, plateformes, objectif. C'est le moteur de
   personnalisation.
3. **Studio IA**
   - *Brief* : choisis un type de contenu + un sujet → 3 variantes éditables.
   - *Clone viral* : colle une URL **et** la transcription d'une vidéo → LogLead
     en extrait la structure (hook / développement / CTA) et régénère un script
     adapté à ta niche (jamais une copie du texte original).
4. **Templates** — 20+ structures prêtes à l'emploi, « Adapter à mon profil » en
   un clic.
5. **Dashboard** — place ton contenu sur le calendrier éditorial, puis exporte
   en CSV / `.ics` (à brancher à Buffer / Make / Zapier pour publier).
6. **Analytics** — vue d'ensemble : cartes de métriques (vues, engagement,
   likes, commentaires, partages, enregistrements, abonnés gagnés, taux de clic,
   leads) avec variation vs période précédente, et graphique multi-séries
   (Jour / Semaine / Mois) avec sélecteur de plage. _Données de démonstration en
   V1_ — à brancher sur les APIs des plateformes + tracking UTM.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** (couleurs de marque `primary #0051FF`, `secondary #0085FF`)
- **Claude API** (`@anthropic-ai/sdk`) pour la génération et l'extraction de
  structure
- **Persistance locale** : fichier JSON sous `data/` (créé automatiquement)
- **Auth** : session par cookie signé + hash scrypt (built-in Node)

## Multi-workspace (multi-startups)

Un même compte peut gérer plusieurs **startups** (workspaces) — utile pour un
founder multi-produits ou une agence multi-clients. Chaque workspace a son
propre profil de marque (onboarding), ses contenus, son calendrier et ses
analytics — totalement isolés. Le switcher en haut à gauche permet de changer de
startup ou d'en créer une nouvelle ; la page **Mon compte** (avatar →
`/settings/profile`) gère le compte, les startups (activer / quitter / créer) et
le mot de passe.

Modèle de données : `users`, `workspaces`, `workspace_members` (jointure
user↔workspace), puis `profiles` et `content_items` portent un `workspace_id`.

## Architecture & migration vers Supabase

Tout l'accès aux données passe par `src/lib/db.ts` (un petit store JSON) et toute
l'auth par `src/lib/auth.ts` (+ `src/lib/workspace.ts` pour le workspace actif).
Ils mirrorent les tables ci-dessus. Pour passer en production avec **Supabase
Postgres + Supabase Auth / Clerk**, il suffit de réécrire ces modules — le reste
du code (routes API, écrans) reste inchangé.

```
src/
  app/            # pages (App Router) + routes API
  components/     # UI (Studio, calendrier, formulaires…)
  lib/            # db, auth, ai (moteur Claude + fallback démo), templates, types
```

## Hors scope V1

Programme/cours structuré, publication native multi-réseaux (on passe par
l'export), bibliothèque de lead magnets exhaustive. L'écran Analytics existe
mais tourne sur des **données de démonstration** (l'intégration réelle des APIs
plateformes + UTM est une étape suivante).
