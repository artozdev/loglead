// Content for the 4 dedicated audience pages (/for/agencies, /for/sales,
// /for/freelancers, /for/founders). Same layout, tailored content.
// NOTE: metrics are placeholders. TODO: replace with real user data.

export type ForDemoLine = { role: "user" | "agent"; text: string };
export type ForResult = { name: string; cols: string[]; score: number; tag?: string };

export type ForPage = {
  slug: "agencies" | "sales" | "freelancers" | "founders";
  metaTitle: string;
  metaDescription: string;
  audience: string;
  badge: string;
  titleTop: string;
  titleGradient: string;
  description: string;
  heroCta: string;
  demoUser: string;
  demoAgent: string[];
  demoSummary: string;
  results: ForResult[];
  problemTitle: string;
  problems: { title: string; body: string }[];
  solutionTitle: string;
  features: { name: string; tag?: string; body: string; signal?: string }[];
  steps: { n: string; title: string; body: string }[];
  metrics: { big: string; small: string }[];
  testimonial: { quote: string; name: string; role: string };
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export const FOR_PAGES: Record<ForPage["slug"], ForPage> = {
  agencies: {
    slug: "agencies",
    metaTitle: "LogLead for Web Agencies — Find local clients automatically",
    metaDescription:
      "LogLead finds local businesses without a website, restaurants with bad Google reviews and SMBs needing digital services. Your AI Sales Agent does the prospecting.",
    audience: "Web Agencies",
    badge: "For Web Agencies",
    titleTop: "Your agency finds clients",
    titleGradient: "while you deliver work.",
    description:
      "LogLead finds local businesses without a website, restaurants with bad Google reviews, SMBs with no digital presence — and contacts them automatically. You focus on delivering. Your agent handles prospecting.",
    heroCta: "Find my first clients →",
    demoUser: "Restaurants in Lyon with Google rating under 4 stars and no website",
    demoAgent: ["Found 34 restaurants matching your criteria.", "Starting qualification…"],
    demoSummary: "34 prospects found · 71% qualified",
    results: [
      { name: "Le Bistrot du Port", cols: ["3.6★", "No website"], score: 93 },
      { name: "Chez Antoine", cols: ["3.8★", "No website"], score: 88 },
      { name: "La Table de Marie", cols: ["3.4★", "No website"], score: 85 },
    ],
    problemTitle: "You're great at building websites. Finding clients to build them for takes half your week.",
    problems: [
      { title: "You spend 10+ hours/week searching for prospects", body: "Google Maps, Facebook groups, local directories… All manual. All repetitive." },
      { title: "Your best leads go cold while you're on delivery", body: "No time to follow up = lost revenue." },
      { title: "Generic outreach doesn't work", body: "“Hi, I noticed your website could be improved…” Everyone sends this. Nobody reads it." },
      { title: "You don't know which businesses actually need you", body: "Wasting time on prospects that already have an agency." },
    ],
    solutionTitle: "LogLead finds the businesses that need you most.",
    features: [
      { name: "Scout — Prospect Discovery", body: "Type “local businesses without website in [city]”. Scout searches Google Maps, LinkedIn and local directories simultaneously. Gets you a list of qualified prospects with contact info in under 2 minutes.", signal: "No website · Bad Google rating · No social media" },
      { name: "Rival — Steal Their Clients", body: "Find businesses currently working with your competitors. Contact them with a better offer at the right moment.", signal: "“Agency X” mentioned in reviews" },
      { name: "AI Outreach", body: "Every message is personalized based on what Scout found about each business. References their specific situation — bad rating, no website, outdated design. Not generic. Impossible to ignore." },
    ],
    steps: [
      { n: "01", title: "Type your target", body: "“Restaurants in France with rating under 4★ and no website”" },
      { n: "02", title: "Scout finds them", body: "Google Maps + LinkedIn + local directories. Qualified, scored, enriched with phone + email." },
      { n: "03", title: "AI writes personalized messages", body: "“I noticed your restaurant doesn't have a website. 3 of your competitors just launched theirs…”" },
      { n: "04", title: "You receive the hot replies", body: "Businesses interested in your services — ready to book a call." },
    ],
    metrics: [
      { big: "34", small: "prospects found per search" },
      { big: "2 min", small: "average search time" },
      { big: "€0", small: "ad budget required" },
      { big: "8/wk", small: "replies · avg for agency users" },
      { big: "3×", small: "faster than manual prospecting" },
      { big: "Focus", small: "on delivery, not prospecting" },
    ],
    testimonial: {
      quote: "We were spending 15 hours a week searching for prospects on Google Maps. With LogLead, I describe what I'm looking for and my agent finds them in 2 minutes. Last week we closed 3 new clients from a single Scout search.",
      name: "Thomas R.", role: "Fondateur agence web · 12 personnes · Paris",
    },
    ctaTitle: "Your next 10 clients are already on Google Maps.",
    ctaSubtitle: "LogLead finds them, contacts them and sends you the replies.",
    ctaPrimary: "Start finding clients →", ctaSecondary: "See a demo",
  },

  sales: {
    slug: "sales",
    metaTitle: "LogLead for Sales Teams — AI-powered pipeline building",
    metaDescription:
      "LogLead finds companies actively hiring sales reps, recently funded startups and competitor clients. Fill your pipeline while you sleep.",
    audience: "Sales Teams",
    badge: "For Sales Teams & SDRs",
    titleTop: "Fill your pipeline",
    titleGradient: "while you sleep.",
    description:
      "LogLead finds companies actively hiring sales reps, recently funded startups and businesses using your competitors. Your AI Sales Agent contacts them, follows up and sends you only the conversations worth your time.",
    heroCta: "Start building my pipeline →",
    demoUser: "B2B SaaS companies between 20 and 200 employees hiring a sales rep in France",
    demoAgent: ["Scanning LinkedIn Jobs · Google · Web…"],
    demoSummary: "22 companies found · 68% qualified",
    results: [
      { name: "Notion", cols: ["Commercial B2B", "Paris"], score: 93 },
      { name: "Figma", cols: ["Business Dev", "Lyon"], score: 88 },
      { name: "Linear", cols: ["Sales Exec", "Paris"], score: 85 },
    ],
    problemTitle: "Your quota doesn't care that prospecting takes 4 hours a day.",
    problems: [
      { title: "Manual prospecting kills your selling time", body: "LinkedIn + Sales Navigator + copy-paste = 4 hours. That's 4 hours not spent closing." },
      { title: "Your best prospects go cold during follow-up", body: "You forget. They move on. Deal lost." },
      { title: "Generic sequences get ignored", body: "Everyone uses the same templates. Open rates below 3%." },
      { title: "You don't know who's actively looking to buy", body: "Contacting cold prospects wastes time and quota." },
    ],
    solutionTitle: "Your AI SDR that works around the clock.",
    features: [
      { name: "Scout — Signal-Based Prospecting", body: "Find companies actively hiring sales reps — the strongest buying signal for sales tools. Or companies recently funded, expanding teams, launching new products. Every prospect is scored by likelihood to buy.", signal: "Job posting · Funding · Team growth" },
      { name: "Rival — Competitor Intelligence", body: "Find companies currently using your competitors' tools. Contact them at the exact moment they're evaluating alternatives.", signal: "Mentioned competitor on LinkedIn / Reddit / G2" },
      { name: "Automated Sequences", body: "First message → 3-day wait → follow-up → 5-day wait → last message. All in your name. All personalized. You only see the replies." },
    ],
    steps: [
      { n: "01", title: "Define your ICP once", body: "“B2B SaaS 20-200 employees hiring sales reps”" },
      { n: "02", title: "Scout finds them daily", body: "LinkedIn Jobs + LinkedIn Companies + Web. Fresh prospects every morning." },
      { n: "03", title: "AI sends personalized sequences", body: "Based on each company's specific signals. Timing optimized for best open rates." },
      { n: "04", title: "Hot replies surface to your inbox", body: "You see only interested prospects. Ready for a call — you close." },
    ],
    metrics: [
      { big: "50+", small: "prospects found daily" },
      { big: "4h/day", small: "saved on manual prospecting" },
      { big: "3×", small: "more qualified conversations" },
      { big: "68%", small: "qualify rate average" },
      { big: "Auto", small: "sequences run automatically" },
      { big: "Close", small: "you focus on closing" },
    ],
    testimonial: {
      quote: "I was spending 4 hours every day on LinkedIn trying to find prospects. With LogLead, I describe what I want and my agent finds 50+ qualified companies overnight. I closed my quota 2 weeks early last month.",
      name: "Camille V.", role: "Account Executive · SaaS B2B · Lyon",
    },
    ctaTitle: "Stop prospecting. Start closing.",
    ctaSubtitle: "Let your AI Sales Agent fill your pipeline while you focus on deals.",
    ctaPrimary: "Hire my sales agent →", ctaSecondary: "See how it works",
  },

  freelancers: {
    slug: "freelancers",
    metaTitle: "LogLead for Freelancers — Never worry about your next client",
    metaDescription:
      "LogLead finds businesses that need exactly what you offer and reaches out with a personalized message. End the feast or famine cycle.",
    audience: "Freelancers",
    badge: "For Freelancers & Consultants",
    titleTop: "Never worry about",
    titleGradient: "your next client again.",
    description:
      "LogLead finds businesses that need exactly what you offer, reaches out with a personalized message and keeps your pipeline full — so you can focus on the work you love.",
    heroCta: "Find my next client →",
    demoUser: "E-commerce brands in France with low Instagram engagement and no SEO strategy",
    demoAgent: ["Searching Instagram · Google · LinkedIn…"],
    demoSummary: "18 brands found · 83% qualified",
    results: [
      { name: "Brand A", cols: ["Low IG", "No blog"], score: 91 },
      { name: "Brand B", cols: ["Low IG", "No SEO"], score: 87 },
      { name: "Brand C", cols: ["Low IG", "No SEO"], score: 84 },
    ],
    problemTitle: "The feast or famine cycle is killing your business.",
    problems: [
      { title: "You're too busy with clients to find new ones", body: "When a project ends, pipeline is empty. Panic mode starts." },
      { title: "Cold outreach feels wrong and gets ignored", body: "You're an expert, not a salesperson. Generic emails feel beneath your skills." },
      { title: "Referrals aren't reliable", body: "Good but unpredictable. You can't build a business on luck." },
      { title: "You don't know who to target", body: "Hours spent researching with no guarantee of finding the right prospect." },
    ],
    solutionTitle: "Your client pipeline runs automatically.",
    features: [
      { name: "Scout — Targeted Prospect Discovery", body: "Describe exactly who needs your services. Scout finds companies with the exact pain points you solve — low SEO, bad design, no social presence, outdated website.", signal: "No website · Low ranking · Weak social media" },
      { name: "AI Personalized Outreach", body: "Every message references something real about their business. Not “I can help you with SEO”. But “I noticed your main competitor ranks #1 for [keyword] while your site doesn't appear in the top 20”." },
      { name: "Rival — Find Unhappy Clients", body: "Find businesses mentioning frustration with their current provider on Reddit, Google reviews or LinkedIn. Contact them at the perfect moment." },
    ],
    steps: [
      { n: "01", title: "Describe your ideal client", body: "“E-commerce brands with no SEO strategy and under €1M revenue”" },
      { n: "02", title: "Scout finds them while you work", body: "Every morning, new qualified prospects matching your exact criteria." },
      { n: "03", title: "AI reaches out in your name", body: "Personalized. Professional. Not salesy. References their specific situation." },
      { n: "04", title: "Interested clients contact you", body: "No chasing. No awkward cold calls. Clients who already understand your value." },
    ],
    metrics: [
      { big: "5-10", small: "new qualified leads / week" },
      { big: "30 min", small: "per week to manage your pipeline" },
      { big: "Steady", small: "pipeline year-round" },
      { big: "End", small: "the feast / famine cycle" },
      { big: "Craft", small: "focus on your craft, not outreach" },
      { big: "Grow", small: "your freelance income predictably" },
    ],
    testimonial: {
      quote: "I was stuck in the feast or famine cycle for 3 years. LogLead changed everything. I describe who I want to work with and my agent finds them and reaches out. I now have a waiting list of clients for the first time.",
      name: "Marc L.", role: "Consultant SEO · Indépendant · Bordeaux",
    },
    ctaTitle: "Build the client pipeline you deserve.",
    ctaSubtitle: "LogLead finds and contacts your ideal clients so you can focus on your expertise.",
    ctaPrimary: "Start finding clients →", ctaSecondary: "See a demo",
  },

  founders: {
    slug: "founders",
    metaTitle: "LogLead for Founders — Find your first 100 customers",
    metaDescription:
      "LogLead finds companies using your competitors and contacts them with your strongest argument. Build your pipeline while you build your product.",
    audience: "Founders",
    badge: "For Founders & Startups",
    titleTop: "Find your first 100 clients.",
    titleGradient: "Faster than your competitors.",
    description:
      "LogLead finds companies that need your product, identifies who uses your competitors and contacts them with a compelling message. Your AI Sales Agent builds your pipeline while you build your product.",
    heroCta: "Start finding customers →",
    demoUser: "Find the clients of [Competitor] who haven't posted about them in 3 months",
    demoAgent: ["Scanning LinkedIn · Reddit · G2 · Capterra…"],
    demoSummary: "31 competitor clients found · 74% qualified",
    results: [
      { name: "Company A", cols: ["Used Taplio"], score: 94, tag: "🎯" },
      { name: "Company B", cols: ["Used Taplio"], score: 88, tag: "🎯" },
      { name: "Company C", cols: ["Used Taplio"], score: 83, tag: "🎯" },
    ],
    problemTitle: "Building the product is the easy part. Finding customers is where startups fail.",
    problems: [
      { title: "You're too focused on product to do sales", body: "Every hour prospecting = one hour not building. But without customers, there's nothing to build for." },
      { title: "You don't know who your early adopters are", body: "They exist. But finding them manually takes months." },
      { title: "Your competitors have a head start", body: "They already have customers you could win. You just don't know who they are." },
      { title: "Your outreach sounds like a pitch", body: "Founders are bad at selling their own product. AI writes better first messages than you do." },
    ],
    solutionTitle: "LogLead finds your first 100 customers.",
    features: [
      { name: "Scout — Early Adopter Discovery", body: "Find companies actively looking for solutions like yours. Job postings, community discussions, product launches — Scout detects the signals that mean “ready to buy”.", signal: "Relevant job posting · Discussing the problem on Reddit" },
      { name: "Rival — Steal Their Clients", tag: "★ Feature phare", body: "Your competitors' clients are your best prospects. They already pay for a solution. Convince them yours is better. Find companies using [Competitor] on LinkedIn, G2, Product Hunt and Reddit. Contact them with your strongest argument." },
      { name: "AI Competitive Messaging", body: "Every message references why your product is better than what they currently use. Specific. Relevant. Impossible to ignore. Ex: “I saw you use [Competitor]. We do the same but with [differentiator].”" },
    ],
    steps: [
      { n: "01", title: "Define your ICP and competitors", body: "“B2B SaaS founders using Taplio with under 1000 LinkedIn followers”" },
      { n: "02", title: "Scout + Rival find your targets", body: "LinkedIn + Reddit + G2 + Product Hunt. Every day, fresh prospects." },
      { n: "03", title: "AI contacts them with your pitch", body: "References their specific situation. Your differentiator front and center." },
      { n: "04", title: "Interested prospects reply", body: "You get meetings with people who already understand the problem you solve." },
    ],
    metrics: [
      { big: "100", small: "first customers, faster" },
      { big: "Rival", small: "competitor clients found & contacted" },
      { big: "24/7", small: "pipeline built while you code" },
      { big: "-60%", small: "time-to-first-revenue" },
      { big: "Auto", small: "outreach runs automatically" },
      { big: "Build", small: "focus on product, not cold DMs" },
    ],
    testimonial: {
      quote: "I was spending 3 hours a day trying to find early adopters on LinkedIn. With LogLead's Rival feature, I found 31 companies using my main competitor and contacted them all in one morning. 8 replied. 3 became paying customers.",
      name: "Julie M.", role: "Fondatrice SaaS B2B · Pre-seed · Paris",
    },
    ctaTitle: "Your first 100 customers are using your competitor.",
    ctaSubtitle: "LogLead finds them, contacts them and sends you the meetings.",
    ctaPrimary: "Find my first customers →", ctaSecondary: "See Rival in action",
  },
};

export const FOR_SLUGS = Object.keys(FOR_PAGES) as ForPage["slug"][];

export const FOR_NAV: { slug: ForPage["slug"]; icon: string; label: string }[] = [
  { slug: "agencies", icon: "🏢", label: "Web Agencies" },
  { slug: "sales", icon: "💼", label: "Sales Teams" },
  { slug: "freelancers", icon: "👤", label: "Freelancers" },
  { slug: "founders", icon: "🚀", label: "Founders" },
];
