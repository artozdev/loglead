// Single source of truth for the /vs/* and /alternative/* comparison pages.
// Tone rule: honest and factual, never disparaging. Each entry states what the
// competitor is genuinely good at, then LogLead's real differentiators.

export type CompareRow = { feature: string; loglead: string; them: string };

export type Competitor = {
  slug: string; // e.g. "lemlist"
  name: string; // e.g. "Lemlist"
  category: string; // short positioning
  hasVs: boolean; // /vs/loglead-vs-<slug>
  hasAlternative: boolean; // /alternative/<slug>-alternative
  intro: string; // what they do (factual, 1-2 sentences)
  bestFor: string; // when THEY are the right pick (honesty)
  rows: CompareRow[]; // comparison table
  whyLoglead: string[]; // real differentiators
  whenThem: string[]; // honest "choose them if…"
  faq: { q: string; a: string }[];
};

const L = "LogLead";

export const COMPETITORS: Competitor[] = [
  {
    slug: "lemlist",
    name: "Lemlist",
    category: "cold email & multichannel outreach",
    hasVs: true,
    hasAlternative: true,
    intro:
      "Lemlist is a cold email and multichannel outreach platform built around sending personalized email sequences (with LinkedIn steps and calls) at scale, plus email warm-up for deliverability.",
    bestFor:
      "teams running high-volume outbound email sequences who want deliverability tooling and a built-in lead database.",
    rows: [
      { feature: "Core approach", loglead: "Inbound + warm leads from LinkedIn engagement", them: "Outbound cold email sequences" },
      { feature: "LinkedIn content generation", loglead: "Yes — in your own voice", them: "No" },
      { feature: "Market intelligence", loglead: "Yes — trends, competitors, signals", them: "No" },
      { feature: "Leads from your post engagement", loglead: "Yes — auto-detected", them: "No" },
      { feature: "Lead enrichment (email/phone)", loglead: "Yes", them: "Yes" },
      { feature: "AI visibility tracking (GEO)", loglead: "Yes", them: "No" },
      { feature: "Cold email sending at scale", loglead: "Not the focus", them: "Yes" },
      { feature: "Entry price", loglead: "Free, then €29/mo", them: "Paid plans only" },
    ],
    whyLoglead: [
      "LogLead turns the people who already engage with your LinkedIn posts into scored leads — warm intent instead of cold lists.",
      "You get market intelligence (trends, competitor activity, buying signals) that a pure sending tool doesn't provide.",
      "AI content is written in your voice from your real posts, so distribution and lead generation live in one place.",
      "AI visibility (GEO) tracks whether ChatGPT, Perplexity and Gemini recommend you — a channel Lemlist doesn't cover.",
    ],
    whenThem: [
      "You run large cold-email campaigns and need advanced sending, warm-up and deliverability controls.",
      "Your motion is outbound-first and you already have strong target lists.",
    ],
    faq: [
      { q: "Is LogLead a Lemlist alternative?", a: "LogLead is an alternative for teams who want to generate B2B leads through LinkedIn content and engagement rather than cold email. Lemlist focuses on outbound email sequencing; LogLead focuses on inbound signals, warm leads and content." },
      { q: "Can I migrate from Lemlist to LogLead?", a: "Yes. Start free with 100 credits, connect your LinkedIn profile URL, and LogLead detects the prospects already engaging with your content. There is no complex import to run." },
      { q: "Does LogLead send cold emails like Lemlist?", a: "No. LogLead is built around LinkedIn content, market intelligence and warm-lead detection. If high-volume cold email is your core channel, Lemlist is a better fit." },
      { q: "Which is cheaper, LogLead or Lemlist?", a: "LogLead has a free offer (100 credits, no card) and paid plans from €29/mo. Pricing depends on usage; compare the plans that match your volume." },
      { q: "Does LogLead do lead enrichment?", a: "Yes — LogLead enriches leads with email and phone, and scores them by buying intent." },
    ],
  },
  {
    slug: "apollo",
    name: "Apollo",
    category: "B2B contact database & sales engagement",
    hasVs: true,
    hasAlternative: true,
    intro:
      "Apollo is a B2B sales platform combining a large contact database (hundreds of millions of records) with email sequencing and a dialer, aimed at outbound sales teams.",
    bestFor:
      "outbound sales teams that need a big searchable contact database and multi-touch sequencing in one tool.",
    rows: [
      { feature: "Core approach", loglead: "LinkedIn content + warm engagement leads", them: "Database + outbound sequencing" },
      { feature: "LinkedIn content generation", loglead: "Yes — in your voice", them: "No" },
      { feature: "Market intelligence", loglead: "Yes", them: "Limited" },
      { feature: "Leads from your post engagement", loglead: "Yes — auto-detected", them: "No" },
      { feature: "Contact database size", loglead: "Focused on LinkedIn signals", them: "Very large" },
      { feature: "Lead enrichment", loglead: "Yes (email/phone)", them: "Yes" },
      { feature: "AI visibility tracking (GEO)", loglead: "Yes", them: "No" },
      { feature: "Entry price", loglead: "Free, then €29/mo", them: "Free tier + paid" },
    ],
    whyLoglead: [
      "LogLead prioritizes warm intent — people engaging with your content — over cold database outreach.",
      "AI content generation and an editorial calendar keep you consistently visible on LinkedIn.",
      "Market intelligence surfaces trends, competitor moves and buying signals in your niche.",
      "AI visibility (GEO) tracking shows how AI assistants describe and recommend your company.",
    ],
    whenThem: [
      "You need the largest possible searchable contact database for cold outbound.",
      "Your team lives in sequences and dialer workflows at high volume.",
    ],
    faq: [
      { q: "Is LogLead an Apollo alternative?", a: "Yes, for teams that prefer LinkedIn-led growth — content, engagement and warm leads — over a large cold-outreach database. Apollo is stronger as a raw contact database and sequencer." },
      { q: "Does LogLead have a contact database like Apollo?", a: "LogLead focuses on LinkedIn signals and the prospects who engage with you, then enriches them. Apollo's advantage is the size of its static database." },
      { q: "Can LogLead enrich emails and phone numbers?", a: "Yes — LogLead enriches leads with verified email and phone and scores them by intent." },
      { q: "Is there a free plan?", a: "Yes, LogLead starts free with 100 credits and no credit card required." },
      { q: "Which should a small B2B team choose?", a: "If distribution and warm inbound leads on LinkedIn matter most, LogLead. If cold database outbound is your core motion, Apollo." },
    ],
  },
  {
    slug: "taplio",
    name: "Taplio",
    category: "LinkedIn personal branding & scheduling",
    hasVs: true,
    hasAlternative: true,
    intro:
      "Taplio is a LinkedIn personal-branding tool focused on content creation, scheduling and post analytics, with a library of viral posts and AI writing assistance.",
    bestFor:
      "creators and founders who mainly want to schedule LinkedIn content and grow an audience.",
    rows: [
      { feature: "Core approach", loglead: "Content + leads + market intelligence", them: "LinkedIn content & scheduling" },
      { feature: "LinkedIn content generation", loglead: "Yes — in your voice", them: "Yes" },
      { feature: "Leads from your post engagement", loglead: "Yes — auto-detected & scored", them: "Limited" },
      { feature: "Lead enrichment (email/phone)", loglead: "Yes", them: "No" },
      { feature: "Market intelligence", loglead: "Yes", them: "No" },
      { feature: "AI visibility tracking (GEO)", loglead: "Yes", them: "No" },
      { feature: "Lead scoring by intent", loglead: "Yes", them: "No" },
      { feature: "Entry price", loglead: "Free, then €29/mo", them: "Paid plans only" },
    ],
    whyLoglead: [
      "LogLead does content and turns the resulting engagement into scored, enriched leads — not just scheduling.",
      "Market intelligence tells you what your market is talking about before you write.",
      "Lead detection auto-imports the people who react and comment on your posts.",
      "AI visibility (GEO) tracking is included, so you also measure presence in AI search.",
    ],
    whenThem: [
      "You only want to schedule LinkedIn posts and track post analytics.",
      "Lead generation and enrichment are not part of your workflow.",
    ],
    faq: [
      { q: "Is LogLead a Taplio alternative?", a: "Yes. Taplio is great for LinkedIn content and scheduling; LogLead adds market intelligence, warm-lead detection from your engagement, enrichment and AI-visibility tracking." },
      { q: "Does LogLead generate LinkedIn content like Taplio?", a: "Yes — LogLead generates posts in your own voice, learned from your real posts, and plans them on an editorial calendar." },
      { q: "What does LogLead add beyond content?", a: "It detects and scores the prospects who engage with your posts, enriches their contact data, and tracks your visibility on AI assistants." },
      { q: "Is there a free plan?", a: "Yes, LogLead starts free with 100 credits, no credit card required." },
      { q: "Which is better for founders?", a: "If you want content plus a pipeline of warm leads, LogLead. If you only need a LinkedIn scheduler, Taplio may be enough." },
    ],
  },
  {
    slug: "clay",
    name: "Clay",
    category: "data enrichment & GTM automation",
    hasVs: true,
    hasAlternative: true,
    intro:
      "Clay is a spreadsheet-style data enrichment and go-to-market automation platform that connects dozens of data providers and AI to build custom prospecting workflows.",
    bestFor:
      "RevOps and technical growth teams who want to build highly custom enrichment and automation pipelines.",
    rows: [
      { feature: "Core approach", loglead: "LinkedIn growth, ready out of the box", them: "Custom data/automation workflows" },
      { feature: "Setup effort", loglead: "Low — guided", them: "High — build-your-own" },
      { feature: "LinkedIn content generation", loglead: "Yes — in your voice", them: "No" },
      { feature: "Leads from your post engagement", loglead: "Yes — auto-detected", them: "Via custom setup" },
      { feature: "Lead enrichment", loglead: "Yes (email/phone)", them: "Yes — many sources" },
      { feature: "Market intelligence", loglead: "Yes", them: "Build-your-own" },
      { feature: "AI visibility tracking (GEO)", loglead: "Yes", them: "No" },
      { feature: "Entry price", loglead: "Free, then €29/mo", them: "Free tier + paid" },
    ],
    whyLoglead: [
      "LogLead works out of the box — no workflow building, credits or data-provider wiring required.",
      "Content generation and distribution are built in, not something you assemble.",
      "Warm leads come from your own LinkedIn engagement, automatically scored.",
      "AI visibility (GEO) tracking is included for the AI-search channel.",
    ],
    whenThem: [
      "You have RevOps resources and want fully custom enrichment/automation pipelines.",
      "You need to combine many data providers with bespoke logic.",
    ],
    faq: [
      { q: "Is LogLead a Clay alternative?", a: "Yes, for teams that want LinkedIn-led growth without building custom workflows. Clay is more powerful and flexible but requires setup; LogLead is ready to use." },
      { q: "Does LogLead enrich data like Clay?", a: "LogLead enriches leads with email and phone and scores them. Clay connects many data sources for bespoke enrichment, which is more flexible but more technical." },
      { q: "Do I need technical skills to use LogLead?", a: "No. LogLead is guided and works out of the box, whereas Clay is closer to a build-your-own platform." },
      { q: "Is there a free plan?", a: "Yes — LogLead starts free with 100 credits, no credit card required." },
      { q: "Which is better for a small team?", a: "If you want results without engineering effort, LogLead. If you want maximum customization and have the resources, Clay." },
    ],
  },
  {
    slug: "instantly",
    name: "Instantly",
    category: "cold email sending & deliverability",
    hasVs: true,
    hasAlternative: false,
    intro:
      "Instantly is a cold email platform focused on sending at scale — unlimited inboxes, warm-up and deliverability tooling for high-volume outbound.",
    bestFor:
      "teams that send large volumes of cold email and need deliverability and inbox rotation.",
    rows: [
      { feature: "Core approach", loglead: "LinkedIn content + warm engagement leads", them: "High-volume cold email" },
      { feature: "LinkedIn content generation", loglead: "Yes — in your voice", them: "No" },
      { feature: "Leads from your post engagement", loglead: "Yes — auto-detected", them: "No" },
      { feature: "Market intelligence", loglead: "Yes", them: "No" },
      { feature: "Lead enrichment (email/phone)", loglead: "Yes", them: "Limited" },
      { feature: "AI visibility tracking (GEO)", loglead: "Yes", them: "No" },
      { feature: "Cold email at scale", loglead: "Not the focus", them: "Yes" },
      { feature: "Entry price", loglead: "Free, then €29/mo", them: "Paid plans only" },
    ],
    whyLoglead: [
      "LogLead builds warm pipeline from LinkedIn engagement instead of cold-email volume.",
      "Content, market intelligence and lead detection live in one platform.",
      "Leads are scored by intent and enriched automatically.",
      "AI visibility (GEO) tracking covers a channel cold-email tools ignore.",
    ],
    whenThem: [
      "Cold email volume and deliverability are your core growth channel.",
      "You need many sending inboxes with warm-up and rotation.",
    ],
    faq: [
      { q: "Is LogLead an Instantly alternative?", a: "Yes, for teams that prefer LinkedIn content and warm engagement leads over high-volume cold email. Instantly is stronger for cold-email sending at scale." },
      { q: "Does LogLead send cold email?", a: "No — LogLead focuses on LinkedIn content, market intelligence and warm-lead detection. For high-volume cold email, Instantly is a better fit." },
      { q: "How does LogLead generate leads then?", a: "It detects and scores the people who engage with your LinkedIn posts, and enriches them with email and phone." },
      { q: "Is there a free plan?", a: "Yes — LogLead starts free with 100 credits, no credit card required." },
      { q: "Can I use both?", a: "Some teams pair LinkedIn content and warm leads (LogLead) with cold email sending (Instantly). They cover different channels." },
    ],
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

// Slugs that have each page type (drives generateStaticParams + sitemap).
export const VS_SLUGS = COMPETITORS.filter((c) => c.hasVs).map((c) => c.slug);
export const ALTERNATIVE_SLUGS = COMPETITORS.filter((c) => c.hasAlternative).map((c) => c.slug);
