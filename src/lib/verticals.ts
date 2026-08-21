// Data for the vertical /for/<slug> pages. Content is honest and capability-
// based — no fabricated customer metrics or fake named testimonials.

export type Vertical = {
  slug: string;
  name: string; // display, e.g. "SaaS founders"
  keyword: string; // primary SEO keyword
  h1: string;
  intro: string; // hero subtitle
  ctaLabel: string; // adapted CTA
  problem: { title: string; points: string[] };
  solutions: { feature: string; desc: string }[];
  fit: string; // one-line "why LogLead fits this vertical"
  faq: { q: string; a: string }[];
};

export const VERTICALS: Vertical[] = [
  {
    slug: "saas-founders",
    name: "SaaS founders",
    keyword: "linkedin lead generation for saas",
    h1: "LinkedIn lead generation for SaaS founders",
    intro:
      "Turn LinkedIn into your #1 acquisition channel — without a marketing team. LogLead finds warm prospects, writes content in your voice and tracks your AI visibility.",
    ctaLabel: "Generate leads as a founder",
    problem: {
      title: "The founder's distribution problem",
      points: [
        "You built the product, but distribution is the real bottleneck — and there's no time for it.",
        "Cold outreach doesn't fit a product-led motion, and hiring a marketer is expensive and slow.",
        "You know LinkedIn works, but posting consistently and turning engagement into pipeline is manual.",
        "You have no visibility into what your market is talking about before you write.",
      ],
    },
    solutions: [
      { feature: "Content in your voice", desc: "LogLead learns from your real posts and generates LinkedIn content that sounds like you — not generic AI. Distribution without the daily grind." },
      { feature: "Warm leads from engagement", desc: "It detects and scores the people who react and comment on your posts, then enriches their email and phone. Warm intent, not cold lists." },
      { feature: "Market intelligence", desc: "See trends, competitor activity and buying signals in your niche so every post lands on what your market actually cares about." },
    ],
    fit: "A single founder can run market intelligence, content and lead generation from one place — no marketing hire required.",
    faq: [
      { q: "Do I need a marketing team to use LogLead?", a: "No. LogLead is built for founders who do growth themselves — content, warm leads and market intelligence in one guided platform." },
      { q: "Will the content sound like AI?", a: "No. LogLead learns your voice from your real posts and avoids generic 'AI LinkedIn' patterns, so posts sound like you." },
      { q: "How do I get leads as a SaaS founder?", a: "Connect your LinkedIn profile and LogLead turns the people engaging with your posts into scored, enriched leads." },
      { q: "Is there a free plan?", a: "Yes — start free with 100 credits, no credit card required." },
    ],
  },
  {
    slug: "agencies",
    name: "agencies",
    keyword: "linkedin lead generation for agencies",
    h1: "LinkedIn lead generation for agencies",
    intro:
      "Build a predictable pipeline and turn your expertise into content that attracts clients. LogLead handles market intelligence, content and warm-lead detection.",
    ctaLabel: "Generate leads for your agency",
    problem: {
      title: "The agency pipeline problem",
      points: [
        "Referrals are great until they dry up — you need a predictable inbound channel.",
        "Your team has real expertise, but turning it into consistent content is time-consuming.",
        "Prospecting by hand across niches doesn't scale as you take on more clients.",
        "You need to prove authority to win better retainers.",
      ],
    },
    solutions: [
      { feature: "Expertise into content", desc: "Turn your team's knowledge into LinkedIn content that demonstrates authority and attracts inbound leads — generated in your voice." },
      { feature: "Warm leads, scored", desc: "LogLead detects who engages with your content, scores them by intent and enriches their contact details, so your pipeline is predictable." },
      { feature: "Market intelligence per niche", desc: "Track trends and buying signals across the niches you serve, so your positioning stays sharp." },
    ],
    fit: "Agencies can build authority and a repeatable inbound pipeline instead of relying only on referrals.",
    faq: [
      { q: "Can LogLead help my agency get more clients?", a: "Yes — it turns your expertise into LinkedIn content and converts the resulting engagement into scored, enriched leads." },
      { q: "Does it work across multiple niches?", a: "Yes. Market intelligence and content adapt to the niche and audience you configure." },
      { q: "Can I manage more than one workspace?", a: "Higher plans support multiple workspaces, which agencies use to separate clients or brands." },
      { q: "Is there a free plan?", a: "Yes — start free with 100 credits, no credit card required." },
    ],
  },
  {
    slug: "consultants",
    name: "consultants",
    keyword: "linkedin prospecting for consultants",
    h1: "LinkedIn prospecting for consultants",
    intro:
      "Find clients without cold calling. LogLead helps you build authority on LinkedIn and turns the people who engage with your content into warm, qualified leads.",
    ctaLabel: "Find clients as a consultant",
    problem: {
      title: "The consultant's client-acquisition problem",
      points: [
        "Your revenue depends on referrals and word of mouth — unpredictable and hard to scale.",
        "Cold calling and cold DMs feel off-brand for a trusted advisor.",
        "You don't have hours to prospect between client work.",
        "Your expertise is your best asset, but it's invisible if you don't publish.",
      ],
    },
    solutions: [
      { feature: "Thought leadership content", desc: "LogLead generates content in your voice that positions you as an expert and attracts inbound interest — no cold calling." },
      { feature: "Warm leads from engagement", desc: "The people who react and comment on your posts are surfaced as scored leads and enriched with contact data." },
      { feature: "Signals and timing", desc: "Know who's showing interest and when to reach out, with a personalized message ready to go." },
    ],
    fit: "Consultants can generate inbound demand from authority content instead of chasing cold prospects.",
    faq: [
      { q: "Can I get clients without cold outreach?", a: "Yes — LogLead is built around inbound: authority content plus warm leads from the people who engage with you." },
      { q: "Do I need to post every day?", a: "No. LogLead generates content in your voice so you can stay consistent without the daily effort." },
      { q: "How are leads qualified?", a: "Leads are scored by intent (a comment signals more than a like) and enriched with email and phone." },
      { q: "Is there a free plan?", a: "Yes — start free with 100 credits, no credit card required." },
    ],
  },
  {
    slug: "sales-teams",
    name: "sales teams",
    keyword: "b2b sales prospecting tool",
    h1: "B2B sales prospecting tool for modern sales teams",
    intro:
      "Give your reps warm, intent-scored leads instead of cold lists. LogLead surfaces prospects showing real interest on LinkedIn and enriches them automatically.",
    ctaLabel: "Equip your sales team",
    problem: {
      title: "The prospecting problem for sales teams",
      points: [
        "Cold lists convert poorly and burn rep time on low-intent contacts.",
        "Reps lack signal on who is actually interested right now.",
        "Prospecting and enrichment are spread across disconnected tools.",
        "Content and outbound live in silos, so warm engagement is wasted.",
      ],
    },
    solutions: [
      { feature: "Intent-scored leads", desc: "LogLead scores prospects by real buying signals from LinkedIn engagement, so reps focus on the warmest opportunities first." },
      { feature: "Automatic enrichment", desc: "Every lead is enriched with verified email and phone — no manual research." },
      { feature: "Market signals", desc: "Detect hiring, launches and other buying signals in your market so reps reach out at the right moment." },
    ],
    fit: "Sales teams spend time on prospects with real intent instead of cold, unqualified lists.",
    faq: [
      { q: "How is this different from a cold-outreach tool?", a: "LogLead prioritizes warm, intent-scored leads from LinkedIn engagement over cold lists, and enriches them automatically." },
      { q: "Does it enrich email and phone?", a: "Yes — leads are enriched with verified email and phone and scored by intent." },
      { q: "Can it detect buying signals?", a: "Yes — market intelligence surfaces hiring, launches and other signals in your target market." },
      { q: "Is there a free plan?", a: "Yes — start free with 100 credits, no credit card required." },
    ],
  },
  {
    slug: "startups",
    name: "startups",
    keyword: "b2b growth for startups",
    h1: "B2B growth for startups, powered by LinkedIn",
    intro:
      "No ad budget? No problem. LogLead helps startups grow on LinkedIn organically — content in your voice, warm leads and market intelligence, all in one place.",
    ctaLabel: "Grow your startup",
    problem: {
      title: "The startup growth problem",
      points: [
        "You need your first customers before you have a budget for paid ads.",
        "Distribution matters more than the product at this stage — and it's hard.",
        "You can't afford a full growth team, yet you need consistent output.",
        "Every euro and hour counts, so tools have to work out of the box.",
      ],
    },
    solutions: [
      { feature: "Organic LinkedIn growth", desc: "Generate consistent content in your voice and build an audience without spending on ads." },
      { feature: "Warm leads, no ad spend", desc: "Turn the engagement on your posts into scored, enriched leads — a channel that compounds over time." },
      { feature: "Works out of the box", desc: "No setup projects or data wiring. Start free with 100 credits and get value in minutes." },
    ],
    fit: "Startups get a compounding organic channel and first customers without paid acquisition.",
    faq: [
      { q: "Can I grow without paid ads?", a: "Yes — LogLead is built for organic LinkedIn growth: content, warm leads and market intelligence, no ad spend required." },
      { q: "How do I get my first customers?", a: "Publish content in your voice and convert the engagement into warm, scored leads you can reach out to." },
      { q: "Is it affordable for a startup?", a: "Yes — start free with 100 credits, then paid plans from €29/mo." },
      { q: "Do I need technical setup?", a: "No — LogLead works out of the box, no data or workflow wiring required." },
    ],
  },
  {
    slug: "b2b-companies",
    name: "B2B companies",
    keyword: "b2b lead generation platform",
    h1: "The B2B lead generation platform for LinkedIn",
    intro:
      "One platform for market intelligence, LinkedIn content, warm-lead detection, enrichment and AI visibility — so your B2B pipeline stops being unpredictable.",
    ctaLabel: "Generate B2B leads",
    problem: {
      title: "The B2B pipeline problem",
      points: [
        "Your growth stack is fragmented across six disconnected tools.",
        "Pipeline is unpredictable and hard to attribute.",
        "Cold outreach is getting less effective while buyers research on LinkedIn and AI assistants.",
        "You lack a single view of content, leads and market signals.",
      ],
    },
    solutions: [
      { feature: "One connected platform", desc: "Market intelligence, content, lead detection, enrichment and AI visibility in one place — not six tools." },
      { feature: "Warm, scored pipeline", desc: "Convert LinkedIn engagement into intent-scored, enriched leads for a more predictable pipeline." },
      { feature: "AI visibility (GEO)", desc: "Track whether ChatGPT, Perplexity and Gemini recommend your company — the channel buyers increasingly use." },
    ],
    fit: "B2B companies replace a fragmented stack with one connected growth platform.",
    faq: [
      { q: "What does LogLead do for B2B companies?", a: "It combines market intelligence, LinkedIn content, warm-lead detection, enrichment and AI-visibility tracking in one platform." },
      { q: "How is the pipeline more predictable?", a: "Leads come from real engagement and are scored by intent, so you focus on prospects likely to convert." },
      { q: "What is AI visibility (GEO)?", a: "It tracks how AI assistants like ChatGPT and Perplexity describe and recommend your company — an emerging B2B discovery channel." },
      { q: "Is there a free plan?", a: "Yes — start free with 100 credits, no credit card required." },
    ],
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}

export const VERTICAL_SLUGS = VERTICALS.map((v) => v.slug);
