import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { decryptField, encryptField } from "./crypto";
import { hasSupabase, readState, writeState } from "./supabase";
import type {
  AgentConversation,
  AgentMessage,
  AgentPayload,
  AlgoInsights,
  ContentAnalysis,
  CmoAction,
  CmoConfig,
  ContentItem,
  CreditTransaction,
  CreditTransactionType,
  MarketReport,
  Campaign,
  Lead,
  LeadEvent,
  LeadEventType,
  LeadScoreConfig,
  LeadScoreWeights,
  Conversation,
  ConversationStatus,
  InboxMessage,
  OnboardingProgress,
  PasswordReset,
  Plan,
  Profile,
  Segment,
  SegmentType,
  SegmentCriteria,
  User,
  VisibilityScan,
  WaitlistEntry,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "./types";

// ---------------------------------------------------------------------------
// Local-first JSON data store.
//
// Everything lives in a single JSON file under ./data. This keeps the MVP
// zero-setup (no DB server, no native modules — `npm run dev` just works).
// All access goes through the small repository API below; to move to Supabase
// Postgres later, re-implement these functions and leave feature code untouched.
//
// Multi-tenancy: a user can belong to several workspaces (via workspaceMembers);
// profiles and content are scoped by workspaceId.
// ---------------------------------------------------------------------------

type Schema = {
  users: User[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  profiles: Profile[];
  contentItems: ContentItem[];
  onboardingProgress: OnboardingProgress[];
  cmoConfig: CmoConfig[];
  cmoActions: CmoAction[];
  leads: Lead[];
  leadEvents: LeadEvent[];
  leadScoreConfig: LeadScoreConfig[];
  campaigns: Campaign[];
  algoInsights: AlgoInsights[];
  contentAnalyses: ContentAnalysis[];
  featureWaitlist: WaitlistEntry[];
  visibilityScans: VisibilityScan[];
  passwordResets: PasswordReset[];
  conversations: Conversation[];
  inboxMessages: InboxMessage[];
  segments: Segment[];
  agentConversations: AgentConversation[];
  agentMessages: AgentMessage[];
  creditTransactions: CreditTransaction[];
  marketReports: MarketReport[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "loglead.json");

const EMPTY: Schema = {
  users: [],
  workspaces: [],
  workspaceMembers: [],
  profiles: [],
  contentItems: [],
  onboardingProgress: [],
  cmoConfig: [],
  cmoActions: [],
  leads: [],
  leadEvents: [],
  leadScoreConfig: [],
  campaigns: [],
  algoInsights: [],
  contentAnalyses: [],
  featureWaitlist: [],
  visibilityScans: [],
  passwordResets: [],
  conversations: [],
  inboxMessages: [],
  segments: [],
  agentConversations: [],
  agentMessages: [],
  creditTransactions: [],
  marketReports: [],
};

// Fill in any missing top-level collections (schema evolution / partial state).
function hydrate(parsed: Partial<Schema>) {
  return {
    users: parsed.users ?? [],
    workspaces: parsed.workspaces ?? [],
    workspaceMembers: parsed.workspaceMembers ?? [],
    profiles: parsed.profiles ?? [],
    contentItems: parsed.contentItems ?? [],
    onboardingProgress: parsed.onboardingProgress ?? [],
    cmoConfig: parsed.cmoConfig ?? [],
    cmoActions: parsed.cmoActions ?? [],
    leads: parsed.leads ?? [],
    leadEvents: parsed.leadEvents ?? [],
    leadScoreConfig: parsed.leadScoreConfig ?? [],
    campaigns: parsed.campaigns ?? [],
    algoInsights: parsed.algoInsights ?? [],
    contentAnalyses: parsed.contentAnalyses ?? [],
    featureWaitlist: parsed.featureWaitlist ?? [],
    visibilityScans: parsed.visibilityScans ?? [],
    passwordResets: parsed.passwordResets ?? [],
    conversations: parsed.conversations ?? [],
    inboxMessages: parsed.inboxMessages ?? [],
    segments: parsed.segments ?? [],
    agentConversations: parsed.agentConversations ?? [],
    agentMessages: parsed.agentMessages ?? [],
    creditTransactions: parsed.creditTransactions ?? [],
    marketReports: parsed.marketReports ?? [],
  };
}

// Persistence: Supabase (production / when configured) or the local JSON file
// (dev fallback). Async because the DB is over the network.
async function read() {
  if (hasSupabase()) {
    const data = await readState<Partial<Schema>>();
    return hydrate(data ?? {});
  }
  try {
    return hydrate(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Partial<Schema>);
  } catch {
    return structuredClone(EMPTY);
  }
}

async function write(db: Schema) {
  if (hasSupabase()) {
    await writeState(db);
    return;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

const now = () => new Date().toISOString();

// ----- Users ---------------------------------------------------------------

export const users = {
  async findByEmail(email: string) {
    return (await read()).users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  },
  async findById(id: string) {
    return (await read()).users.find((u) => u.id === id);
  },
  async create(email: string, passwordHash: string) {
    const db = (await read());
    const user: User = {
      id: randomUUID(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: now(),
    };
    db.users.push(user);
    await write(db);
    return user;
  },
  async updatePassword(id: string, passwordHash: string) {
    const db = (await read());
    db.users = db.users.map((u) => (u.id === id ? { ...u, passwordHash } : u));
    await write(db);
  },
  async updateEmailPrefs(id: string, prefs: User["emailPrefs"]) {
    const db = (await read());
    db.users = db.users.map((u) =>
      u.id === id ? { ...u, emailPrefs: { ...u.emailPrefs, ...prefs } } : u,
    );
    await write(db);
  },
  async markEmailVerified(id: string) {
    const db = (await read());
    db.users = db.users.map((u) =>
      u.id === id ? { ...u, emailVerifiedAt: now() } : u,
    );
    await write(db);
  },
};

// ----- Password resets (one-time tokens, hash only) --------------------------

export const passwordResets = {
  async create(userId: string, tokenHash: string) {
    const db = (await read());
    // Any previous pending token for this user becomes unusable.
    db.passwordResets = db.passwordResets.filter((r) => r.userId !== userId);
    const reset: PasswordReset = {
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      usedAt: null,
      createdAt: now(),
    };
    db.passwordResets.push(reset);
    await write(db);
    return reset;
  },
  async findValid(tokenHash: string) {
    return (await read()).passwordResets.find(
      (r) => r.tokenHash === tokenHash && r.usedAt === null && r.expiresAt > now(),
    );
  },
  async markUsed(id: string) {
    const db = (await read());
    db.passwordResets = db.passwordResets.map((r) =>
      r.id === id ? { ...r, usedAt: now() } : r,
    );
    await write(db);
  },
};

// ----- Feature waitlist (coming-soon signups) ------------------------------

export const waitlist = {
  async isSubscribed(feature: string, email: string) {
    const e = email.toLowerCase();
    return (await read()).featureWaitlist.some(
      (w) => w.feature === feature && w.email.toLowerCase() === e,
    );
  },
  // Idempotent: returns { already: true } if this email is already on the list.
  async add(
    feature: string,
    email: string,
    userId: string,
  ) {
    const db = (await read());
    const e = email.toLowerCase();
    const existing = db.featureWaitlist.find(
      (w) => w.feature === feature && w.email.toLowerCase() === e,
    );
    if (existing) return { entry: existing, already: true };
    const entry: WaitlistEntry = {
      id: randomUUID(),
      feature,
      email,
      userId,
      createdAt: now(),
    };
    db.featureWaitlist.push(entry);
    await write(db);
    return { entry, already: false };
  },
};

// ----- Workspaces & members ------------------------------------------------

export const workspaces = {
  async listAll() {
    return (await read()).workspaces;
  },
  async create(name: string, ownerId: string) {
    const db = (await read());
    const ws: Workspace = {
      id: randomUUID(),
      name,
      ownerId,
      plan: "pro", // demo default — the CMO IA is available out of the box
      createdAt: now(),
      planChosen: false, // must pick a plan on the mandatory /onboarding/plan screen
      credits: 0,
      monthlyCreditsLimit: 0,
    };
    db.workspaces.push(ws);
    db.workspaceMembers.push({
      id: randomUUID(),
      userId: ownerId,
      workspaceId: ws.id,
      role: "owner",
      createdAt: now(),
    });
    await write(db);
    return ws;
  },
  async findById(id: string) {
    return (await read()).workspaces.find((w) => w.id === id);
  },
  async rename(id: string, name: string) {
    const db = (await read());
    let updated: Workspace | undefined;
    db.workspaces = db.workspaces.map((w) => {
      if (w.id !== id) return w;
      updated = { ...w, name };
      return updated;
    });
    if (updated) await write(db);
    return updated;
  },
  async setPlan(id: string, plan: Plan) {
    const db = (await read());
    db.workspaces = db.workspaces.map((w) => (w.id === id ? { ...w, plan } : w));
    await write(db);
  },
  // Public LinkedIn profile URL — used to auto-detect leads from engagement.
  async setLinkedInProfileUrl(id: string, url: string) {
    const db = await read();
    db.workspaces = db.workspaces.map((w) =>
      w.id === id ? { ...w, linkedinProfileUrl: url || undefined } : w,
    );
    await write(db);
  },
  // Stamp the last engagement-detection run (rate-limit cooldown).
  async markLeadDetect(id: string) {
    const db = await read();
    db.workspaces = db.workspaces.map((w) =>
      w.id === id ? { ...w, lastLeadDetectAt: now() } : w,
    );
    await write(db);
  },
  // Opt-in to daily automatic lead detection (cron).
  async setAutoDetectLeads(id: string, on: boolean) {
    const db = await read();
    db.workspaces = db.workspaces.map((w) =>
      w.id === id ? { ...w, autoDetectLeads: on } : w,
    );
    await write(db);
  },
  // Mandatory post-onboarding plan pick: records the plan, starts the 7-day
  // trial, grants the trial credits and logs the grant to the ledger.
  async selectPlan(
    id: string,
    plan: Plan,
    opts: { trialCredits: number; trialDays: number; monthlyLimit: number },
  ) {
    const db = (await read());
    const ws = db.workspaces.find((w) => w.id === id);
    if (!ws) return undefined;
    const start = new Date();
    const end = new Date(start.getTime() + opts.trialDays * 24 * 60 * 60 * 1000);
    const updated: Workspace = {
      ...ws,
      plan,
      planChosen: true,
      credits: opts.trialCredits,
      monthlyCreditsLimit: opts.monthlyLimit,
      trialStartsAt: start.toISOString(),
      trialEndsAt: end.toISOString(),
      creditsRenewAt: end.toISOString(),
    };
    db.workspaces = db.workspaces.map((w) => (w.id === id ? updated : w));
    db.creditTransactions.push({
      id: randomUUID(),
      workspaceId: id,
      type: "trial",
      credits: opts.trialCredits,
      amountEur: null,
      balanceAfter: opts.trialCredits,
      createdAt: now(),
    });
    await write(db);
    return updated;
  },
  // Free offer: grant the one-time credits, mark the plan chosen, NO renewal
  // and NO trial dates (the credits simply expire once spent). Idempotent-ish:
  // only grants the bonus the first time the workspace lands on 'free'.
  async grantFree(id: string, freeCredits: number) {
    const db = await read();
    const ws = db.workspaces.find((w) => w.id === id);
    if (!ws) return undefined;
    const alreadyGranted = db.creditTransactions.some(
      (tx) => tx.workspaceId === id && tx.type === "trial",
    );
    const credits = alreadyGranted ? (ws.credits ?? 0) : freeCredits;
    const updated: Workspace = {
      ...ws,
      plan: "free",
      planChosen: true,
      credits,
      monthlyCreditsLimit: 0,
      trialStartsAt: undefined,
      trialEndsAt: undefined,
      creditsRenewAt: undefined,
    };
    db.workspaces = db.workspaces.map((w) => (w.id === id ? updated : w));
    if (!alreadyGranted) {
      db.creditTransactions.push({
        id: randomUUID(),
        workspaceId: id,
        type: "trial",
        action: "signup_bonus",
        credits: freeCredits,
        amountEur: null,
        balanceAfter: freeCredits,
        createdAt: now(),
      });
    }
    await write(db);
    return updated;
  },
  // Activate a paid subscription after a successful Stripe payment: set the
  // plan, its monthly quota, add this month's credits and schedule renewal.
  async activateSubscription(id: string, plan: Plan, monthlyCredits: number) {
    const db = await read();
    const ws = db.workspaces.find((w) => w.id === id);
    if (!ws) return undefined;
    const renew = new Date();
    renew.setMonth(renew.getMonth() + 1);
    const next = (ws.credits ?? 0) + monthlyCredits;
    const updated: Workspace = {
      ...ws,
      plan,
      planChosen: true,
      credits: next,
      monthlyCreditsLimit: monthlyCredits,
      trialStartsAt: undefined,
      trialEndsAt: undefined,
      creditsRenewAt: renew.toISOString(),
    };
    db.workspaces = db.workspaces.map((w) => (w.id === id ? updated : w));
    db.creditTransactions.push({
      id: randomUUID(),
      workspaceId: id,
      type: "monthly_renewal",
      action: `subscribe_${plan}`,
      credits: monthlyCredits,
      amountEur: null,
      balanceAfter: next,
      createdAt: now(),
    });
    await write(db);
    return updated;
  },
  // LinkedIn OAuth connection — token encrypted at rest.
  async setLinkedIn(
    id: string,
    conn: { accessToken: string; memberSub: string; name?: string; expiresAt: string },
  ) {
    const db = (await read());
    db.workspaces = db.workspaces.map((w) =>
      w.id === id
        ? {
            ...w,
            linkedin: {
              accessToken: encryptField(conn.accessToken)!,
              memberSub: conn.memberSub,
              name: conn.name,
              expiresAt: conn.expiresAt,
              connectedAt: now(),
            },
          }
        : w,
    );
    await write(db);
  },
  async clearLinkedIn(id: string) {
    const db = (await read());
    db.workspaces = db.workspaces.map((w) => {
      if (w.id !== id) return w;
      const { linkedin: _drop, ...rest } = w;
      return rest;
    });
    await write(db);
  },
  // Returns the connection with the access token decrypted (server-only use).
  async getLinkedIn(id: string) {
    const w = (await read()).workspaces.find((x) => x.id === id);
    if (!w?.linkedin) return undefined;
    return { ...w.linkedin, accessToken: decryptField(w.linkedin.accessToken)! };
  },
  async listForUser(userId: string) {
    const db = (await read());
    const ids = new Set(
      db.workspaceMembers
        .filter((m) => m.userId === userId)
        .map((m) => m.workspaceId),
    );
    return db.workspaces
      .filter((w) => ids.has(w.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
};

// ----- Credits ledger ------------------------------------------------------
// All balance mutations go through here so every change is logged and the
// balance is never negative. Consumption is atomic against a re-read state.
export const credits = {
  async balance(workspaceId: string): Promise<number> {
    const ws = (await read()).workspaces.find((w) => w.id === workspaceId);
    return ws?.credits ?? 0;
  },

  // Atomically spend `amount` for `action`. Returns the new balance, or null
  // when the balance is insufficient (nothing is debited in that case).
  async consume(
    workspaceId: string,
    action: string,
    amount: number,
  ): Promise<{ ok: true; balance: number } | { ok: false; balance: number }> {
    const db = (await read());
    const ws = db.workspaces.find((w) => w.id === workspaceId);
    const current = ws?.credits ?? 0;
    if (!ws || current < amount) return { ok: false, balance: current };
    const next = current - amount;
    ws.credits = next;
    db.creditTransactions.push({
      id: randomUUID(),
      workspaceId,
      type: "consumption",
      action,
      credits: -amount,
      amountEur: null,
      balanceAfter: next,
      createdAt: now(),
    });
    await write(db);
    return { ok: true, balance: next };
  },

  // Add credits (purchase or monthly renewal). Idempotent on stripePaymentIntent.
  async add(
    workspaceId: string,
    amount: number,
    opts: { type: CreditTransactionType; amountEur?: number | null; stripePaymentIntent?: string | null } = {
      type: "purchase",
    },
  ): Promise<number> {
    const db = (await read());
    const ws = db.workspaces.find((w) => w.id === workspaceId);
    if (!ws) return 0;
    // Idempotency: skip if this payment intent was already credited.
    if (
      opts.stripePaymentIntent &&
      db.creditTransactions.some((tx) => tx.stripePaymentIntent === opts.stripePaymentIntent)
    ) {
      return ws.credits ?? 0;
    }
    const next = (ws.credits ?? 0) + amount;
    ws.credits = next;
    db.creditTransactions.push({
      id: randomUUID(),
      workspaceId,
      type: opts.type,
      credits: amount,
      amountEur: opts.amountEur ?? null,
      stripePaymentIntent: opts.stripePaymentIntent ?? null,
      balanceAfter: next,
      createdAt: now(),
    });
    await write(db);
    return next;
  },

  async transactions(workspaceId: string, limit = 200): Promise<CreditTransaction[]> {
    return (await read()).creditTransactions
      .filter((tx) => tx.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  },
};

// ----- Market Intelligence reports (one per workspace, overwritten) ---------
export const marketReports = {
  async get(workspaceId: string): Promise<MarketReport | null> {
    return (await read()).marketReports.find((r) => r.workspaceId === workspaceId) ?? null;
  },
  async save(report: MarketReport): Promise<MarketReport> {
    const db = await read();
    db.marketReports = db.marketReports.filter((r) => r.workspaceId !== report.workspaceId);
    db.marketReports.push(report);
    await write(db);
    return report;
  },
};

export const workspaceMembers = {
  async add(userId: string, workspaceId: string, role: WorkspaceRole) {
    const db = (await read());
    const member: WorkspaceMember = {
      id: randomUUID(),
      userId,
      workspaceId,
      role,
      createdAt: now(),
    };
    db.workspaceMembers.push(member);
    await write(db);
    return member;
  },
  async find(userId: string, workspaceId: string) {
    return (await read()).workspaceMembers.find(
      (m) => m.userId === userId && m.workspaceId === workspaceId,
    );
  },
  async isMember(userId: string, workspaceId: string) {
    return Boolean(this.find(userId, workspaceId));
  },
  async remove(userId: string, workspaceId: string) {
    const db = (await read());
    const before = db.workspaceMembers.length;
    db.workspaceMembers = db.workspaceMembers.filter(
      (m) => !(m.userId === userId && m.workspaceId === workspaceId),
    );
    if (db.workspaceMembers.length === before) return false;
    await write(db);
    return true;
  },
};

// ----- Profiles (workspace-scoped) -----------------------------------------

export type ProfileInput = Omit<
  Profile,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export const profiles = {
  async findByWorkspace(workspaceId: string) {
    return (await read()).profiles.find((p) => p.workspaceId === workspaceId);
  },
  async upsert(workspaceId: string, input: ProfileInput) {
    const db = (await read());
    const existing = db.profiles.find((p) => p.workspaceId === workspaceId);
    if (existing) {
      const updated: Profile = { ...existing, ...input, updatedAt: now() };
      db.profiles = db.profiles.map((p) =>
        p.workspaceId === workspaceId ? updated : p,
      );
      await write(db);
      return updated;
    }
    const created: Profile = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
      updatedAt: now(),
    };
    db.profiles.push(created);
    await write(db);
    return created;
  },
  // ----- Onboarding checklist ----------------------------------------------
  // Idempotent: records a completed step in profile.checklistSteps.
  async completeChecklistStep(workspaceId: string, step: string) {
    const db = (await read());
    const p = db.profiles.find((x) => x.workspaceId === workspaceId);
    if (!p) return;
    const steps = p.checklistSteps ?? [];
    if (steps.includes(step)) return;
    db.profiles = db.profiles.map((x) =>
      x.workspaceId === workspaceId
        ? { ...x, checklistSteps: [...steps, step], updatedAt: now() }
        : x,
    );
    await write(db);
  },
  async setChecklistDismissed(workspaceId: string, dismissed: boolean) {
    const db = (await read());
    if (!db.profiles.some((x) => x.workspaceId === workspaceId)) return;
    db.profiles = db.profiles.map((x) =>
      x.workspaceId === workspaceId
        ? { ...x, checklistDismissed: dismissed, updatedAt: now() }
        : x,
    );
    await write(db);
  },
};

// ----- Onboarding progress (workspace-scoped, per-step autosave) -----------

export const onboardingProgress = {
  async get(workspaceId: string) {
    return (await read()).onboardingProgress.find((o) => o.workspaceId === workspaceId);
  },
  async upsert(
    workspaceId: string,
    step: number,
    data: Record<string, unknown>,
  ) {
    const db = (await read());
    const existing = db.onboardingProgress.find(
      (o) => o.workspaceId === workspaceId,
    );
    if (existing) {
      const updated: OnboardingProgress = {
        ...existing,
        step,
        data,
        updatedAt: now(),
      };
      db.onboardingProgress = db.onboardingProgress.map((o) =>
        o.workspaceId === workspaceId ? updated : o,
      );
      await write(db);
      return updated;
    }
    const created: OnboardingProgress = {
      id: randomUUID(),
      workspaceId,
      step,
      data,
      completedAt: null,
      updatedAt: now(),
    };
    db.onboardingProgress.push(created);
    await write(db);
    return created;
  },
  async complete(workspaceId: string) {
    const db = (await read());
    db.onboardingProgress = db.onboardingProgress.map((o) =>
      o.workspaceId === workspaceId
        ? { ...o, completedAt: now(), updatedAt: now() }
        : o,
    );
    await write(db);
  },
};

// ----- Content items (workspace-scoped) ------------------------------------

export type ContentInput = Pick<
  ContentItem,
  "type" | "platform" | "title" | "body" | "source"
> &
  Partial<Pick<ContentItem, "status" | "scheduledDate" | "scheduledTime">>;

export const contentItems = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .contentItems.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async findById(id: string, workspaceId: string) {
    return (await read()).contentItems.find(
      (c) => c.id === id && c.workspaceId === workspaceId,
    );
  },
  async create(workspaceId: string, input: ContentInput) {
    const db = (await read());
    const item: ContentItem = {
      id: randomUUID(),
      workspaceId,
      type: input.type,
      platform: input.platform,
      title: input.title,
      body: input.body,
      source: input.source,
      status: input.status ?? (input.scheduledDate ? "scheduled" : "draft"),
      scheduledDate: input.scheduledDate ?? null,
      scheduledTime: input.scheduledTime ?? (input.scheduledDate ? "09:00" : null),
      createdAt: now(),
    };
    db.contentItems.push(item);
    await write(db);
    return item;
  },
  async update(
    id: string,
    workspaceId: string,
    patch: Partial<
      Pick<ContentItem, "title" | "body" | "status" | "scheduledDate" | "scheduledTime">
    >,
  ) {
    const db = (await read());
    const existing = db.contentItems.find(
      (c) => c.id === id && c.workspaceId === workspaceId,
    );
    if (!existing) return undefined;
    const updated: ContentItem = { ...existing, ...patch };
    if (patch.scheduledDate !== undefined) {
      updated.status = patch.scheduledDate ? "scheduled" : "draft";
      // Default a publish time when scheduling; clear it when unscheduling.
      if (patch.scheduledTime === undefined) {
        updated.scheduledTime = patch.scheduledDate ? existing.scheduledTime ?? "09:00" : null;
      }
    }
    db.contentItems = db.contentItems.map((c) => (c.id === id ? updated : c));
    await write(db);
    return updated;
  },
  async remove(id: string, workspaceId: string) {
    const db = (await read());
    const before = db.contentItems.length;
    db.contentItems = db.contentItems.filter(
      (c) => !(c.id === id && c.workspaceId === workspaceId),
    );
    if (db.contentItems.length === before) return false;
    await write(db);
    return true;
  },
};

// ----- CMO IA ("Loger") ----------------------------------------------------

const DEFAULT_CMO_CONFIG = (workspaceId: string): CmoConfig => ({
  workspaceId,
  activatedAt: null,
  status: "active",
  briefHour: "08:00",
  autonomyLevel: 1,
  priorities: [],
  priorityChannels: [],
  autopilot: false,
  updatedAt: now(),
});

export const cmoConfig = {
  async get(workspaceId: string) {
    return (
      (await read()).cmoConfig.find((c) => c.workspaceId === workspaceId) ??
      DEFAULT_CMO_CONFIG(workspaceId)
    );
  },
  async upsert(workspaceId: string, patch: Partial<CmoConfig>) {
    const db = (await read());
    const existing = db.cmoConfig.find((c) => c.workspaceId === workspaceId);
    const base = existing ?? DEFAULT_CMO_CONFIG(workspaceId);
    const updated: CmoConfig = { ...base, ...patch, workspaceId, updatedAt: now() };
    db.cmoConfig = existing
      ? db.cmoConfig.map((c) => (c.workspaceId === workspaceId ? updated : c))
      : [...db.cmoConfig, updated];
    await write(db);
    return updated;
  },
};

export const cmoActions = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .cmoActions.filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async findById(id: string, workspaceId: string) {
    return (await read()).cmoActions.find(
      (a) => a.id === id && a.workspaceId === workspaceId,
    );
  },
  async create(
    workspaceId: string,
    input: Omit<CmoAction, "id" | "workspaceId" | "createdAt" | "status"> &
      Partial<Pick<CmoAction, "status">>,
  ) {
    const db = (await read());
    const action: CmoAction = {
      id: randomUUID(),
      workspaceId,
      status: input.status ?? "pending",
      createdAt: now(),
      ...input,
    };
    db.cmoActions.push(action);
    await write(db);
    return action;
  },
  async update(
    id: string,
    workspaceId: string,
    patch: Partial<CmoAction>,
  ) {
    const db = (await read());
    const existing = db.cmoActions.find(
      (a) => a.id === id && a.workspaceId === workspaceId,
    );
    if (!existing) return undefined;
    const updated: CmoAction = { ...existing, ...patch };
    db.cmoActions = db.cmoActions.map((a) => (a.id === id ? updated : a));
    await write(db);
    return updated;
  },
};

// ----- Leads (CRM, email/phone encrypted at rest) --------------------------

export type LeadInput = Omit<
  Lead,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

// Email/phone are decrypted only on the way out of the repo.
function decryptLead(l: Lead) {
  return { ...l, email: decryptField(l.email), phone: decryptField(l.phone) };
}

export const leads = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .leads.filter((l) => l.workspaceId === workspaceId)
      .map(decryptLead)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async findById(id: string, workspaceId: string) {
    const l = (await read()).leads.find(
      (x) => x.id === id && x.workspaceId === workspaceId,
    );
    return l ? decryptLead(l) : undefined;
  },
  async create(workspaceId: string, input: LeadInput) {
    const db = (await read());
    const lead: Lead = {
      id: randomUUID(),
      workspaceId,
      ...input,
      email: encryptField(input.email),
      phone: encryptField(input.phone),
      createdAt: now(),
      updatedAt: now(),
    };
    db.leads.push(lead);
    await write(db);
    return decryptLead(lead);
  },
  async update(
    id: string,
    workspaceId: string,
    patch: Partial<LeadInput>,
  ) {
    const db = (await read());
    const existing = db.leads.find(
      (l) => l.id === id && l.workspaceId === workspaceId,
    );
    if (!existing) return undefined;
    const next: Lead = { ...existing, ...patch, updatedAt: now() };
    if ("email" in patch) next.email = encryptField(patch.email);
    if ("phone" in patch) next.phone = encryptField(patch.phone);
    db.leads = db.leads.map((l) => (l.id === id ? next : l));
    await write(db);
    return decryptLead(next);
  },
  async remove(id: string, workspaceId: string) {
    const db = (await read());
    const before = db.leads.length;
    db.leads = db.leads.filter(
      (l) => !(l.id === id && l.workspaceId === workspaceId),
    );
    if (db.leads.length === before) return false;
    db.leadEvents = db.leadEvents.filter((e) => e.leadId !== id);
    await write(db);
    return true;
  },
};

// ----- Algo Insider (one cached guide per workspace) -----------------------

export const algoInsights = {
  async get(workspaceId: string) {
    return (await read()).algoInsights.find((a) => a.workspaceId === workspaceId);
  },
  async upsert(workspaceId: string, data: Omit<AlgoInsights, "workspaceId">) {
    const db = (await read());
    const record: AlgoInsights = { workspaceId, ...data };
    const exists = db.algoInsights.some((a) => a.workspaceId === workspaceId);
    db.algoInsights = exists
      ? db.algoInsights.map((a) => (a.workspaceId === workspaceId ? record : a))
      : [...db.algoInsights, record];
    await write(db);
    return record;
  },
};

// ----- Content analyses (history per workspace) ----------------------------

export const contentAnalyses = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .contentAnalyses.filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async create(
    workspaceId: string,
    input: Omit<ContentAnalysis, "id" | "workspaceId" | "createdAt">,
  ) {
    const db = (await read());
    const record: ContentAnalysis = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
    };
    db.contentAnalyses.push(record);
    await write(db);
    return record;
  },
};

// ----- IA Visibility scans (workspace-scoped) -------------------------------

export const visibilityScans = {
  // Newest first.
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .visibilityScans.filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async countThisMonth(workspaceId: string) {
    const prefix = new Date().toISOString().slice(0, 7);
    return (await read()).visibilityScans.filter(
      (s) => s.workspaceId === workspaceId && s.createdAt.startsWith(prefix),
    ).length;
  },
  async create(
    workspaceId: string,
    input: Omit<VisibilityScan, "id" | "workspaceId" | "createdAt">,
  ) {
    const db = (await read());
    const scan: VisibilityScan = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
    };
    db.visibilityScans.push(scan);
    await write(db);
    return scan;
  },
};

export const leadEvents = {
  async listByLead(leadId: string) {
    return (await read())
      .leadEvents.filter((e) => e.leadId === leadId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  async create(
    leadId: string,
    type: LeadEventType,
    data: Record<string, unknown> = {},
  ) {
    const db = (await read());
    const event: LeadEvent = {
      id: randomUUID(),
      leadId,
      type,
      data,
      createdAt: now(),
    };
    db.leadEvents.push(event);
    await write(db);
    return event;
  },
};

// ----- Lead score config (one weight set per workspace) --------------------

export const leadScoreConfig = {
  async get(workspaceId: string) {
    return (await read()).leadScoreConfig.find((c) => c.workspaceId === workspaceId);
  },
  async upsert(workspaceId: string, weights: LeadScoreWeights) {
    const db = (await read());
    const record: LeadScoreConfig = { workspaceId, weights, updatedAt: now() };
    const exists = db.leadScoreConfig.some((c) => c.workspaceId === workspaceId);
    db.leadScoreConfig = exists
      ? db.leadScoreConfig.map((c) => (c.workspaceId === workspaceId ? record : c))
      : [...db.leadScoreConfig, record];
    await write(db);
    return record;
  },
};

// ----- Campaigns (multichannel distribution) -------------------------------

export const campaigns = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .campaigns.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async findById(id: string, workspaceId: string) {
    return (await read()).campaigns.find((c) => c.id === id && c.workspaceId === workspaceId);
  },
  async create(workspaceId: string, input: Omit<Campaign, "id" | "workspaceId" | "createdAt">) {
    const db = (await read());
    const campaign: Campaign = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
    };
    db.campaigns.push(campaign);
    await write(db);
    return campaign;
  },
  async update(id: string, workspaceId: string, patch: Partial<Campaign>) {
    const db = (await read());
    const existing = db.campaigns.find((c) => c.id === id && c.workspaceId === workspaceId);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    db.campaigns = db.campaigns.map((c) => (c.id === id ? next : c));
    await write(db);
    return next;
  },
  async remove(id: string, workspaceId: string) {
    const db = (await read());
    const before = db.campaigns.length;
    db.campaigns = db.campaigns.filter((c) => !(c.id === id && c.workspaceId === workspaceId));
    if (db.campaigns.length === before) return false;
    await write(db);
    return true;
  },
};

// ----- LogReach — conversations & messages -----------------------------------

export const conversations = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .conversations.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) =>
        (b.lastMessageAt ?? b.createdAt) < (a.lastMessageAt ?? a.createdAt) ? -1 : 1,
      );
  },
  async findById(id: string, workspaceId: string) {
    return (await read()).conversations.find(
      (c) => c.id === id && c.workspaceId === workspaceId,
    );
  },
  async findByLead(leadId: string, workspaceId: string) {
    return (await read()).conversations.find(
      (c) => c.leadId === leadId && c.workspaceId === workspaceId,
    );
  },
  async create(workspaceId: string, leadId: string) {
    const db = (await read());
    const conv: Conversation = {
      id: randomUUID(),
      workspaceId,
      leadId,
      channel: "email",
      status: "contacted",
      lastMessageAt: null,
      createdAt: now(),
    };
    db.conversations.push(conv);
    await write(db);
    return conv;
  },
  async setStatus(id: string, status: ConversationStatus) {
    const db = (await read());
    db.conversations = db.conversations.map((c) =>
      c.id === id ? { ...c, status } : c,
    );
    await write(db);
  },
  async touch(id: string) {
    const db = (await read());
    db.conversations = db.conversations.map((c) =>
      c.id === id ? { ...c, lastMessageAt: now() } : c,
    );
    await write(db);
  },
};

export const inboxMessages = {
  async listByConversation(conversationId: string) {
    return (await read())
      .inboxMessages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1));
  },
  // All messages of a workspace (for the monthly quota + metrics).
  async listByWorkspace(workspaceId: string) {
    const convIds = new Set(
      (await read()).conversations.filter((c) => c.workspaceId === workspaceId).map((c) => c.id),
    );
    return (await read()).inboxMessages.filter((m) => convIds.has(m.conversationId));
  },
  async create(
    conversationId: string,
    input: Pick<InboxMessage, "direction" | "content" | "isAiGenerated">,
  ) {
    const db = (await read());
    const msg: InboxMessage = {
      id: randomUUID(),
      conversationId,
      ...input,
      sentAt: now(),
      readAt: input.direction === "outbound" ? now() : null,
    };
    db.inboxMessages.push(msg);
    await write(db);
    return msg;
  },
};

// ----- Segments (criteria-derived membership) --------------------------------

export const segments = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .segments.filter((sg) => sg.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  async findById(id: string, workspaceId: string) {
    return (await read()).segments.find((sg) => sg.id === id && sg.workspaceId === workspaceId);
  },
  async create(
    workspaceId: string,
    input: {
      name: string;
      description?: string;
      type: SegmentType;
      criteria: SegmentCriteria;
      logreachLinked?: boolean;
    },
  ) {
    const db = (await read());
    const seg: Segment = {
      id: randomUUID(),
      workspaceId,
      name: input.name,
      description: input.description,
      type: input.type,
      criteria: input.criteria,
      isArchived: false,
      logreachLinked: input.logreachLinked ?? false,
      createdAt: now(),
    };
    db.segments.push(seg);
    await write(db);
    return seg;
  },
  async update(
    id: string,
    workspaceId: string,
    patch: Partial<Pick<Segment, "name" | "description" | "criteria" | "isArchived" | "logreachLinked">>,
  ) {
    const db = (await read());
    const existing = db.segments.find((sg) => sg.id === id && sg.workspaceId === workspaceId);
    if (!existing) return undefined;
    const updated: Segment = { ...existing, ...patch };
    db.segments = db.segments.map((sg) => (sg.id === id ? updated : sg));
    await write(db);
    return updated;
  },
  async remove(id: string, workspaceId: string) {
    const db = (await read());
    const before = db.segments.length;
    db.segments = db.segments.filter((sg) => !(sg.id === id && sg.workspaceId === workspaceId));
    if (db.segments.length === before) return false;
    await write(db);
    return true;
  },
};

// ----- LogAgent (conversations + messages + credit ledger) -------------------

export const agentConversations = {
  async listByWorkspace(workspaceId: string) {
    return (await read())
      .agentConversations.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)); // newest first
  },
  async findById(id: string, workspaceId: string) {
    return (await read()).agentConversations.find((c) => c.id === id && c.workspaceId === workspaceId);
  },
  async create(workspaceId: string, title: string) {
    const db = (await read());
    const conv: AgentConversation = {
      id: randomUUID(),
      workspaceId,
      title,
      createdAt: now(),
      updatedAt: now(),
    };
    db.agentConversations.push(conv);
    await write(db);
    return conv;
  },
  async touch(id: string) {
    const db = (await read());
    db.agentConversations = db.agentConversations.map((c) =>
      c.id === id ? { ...c, updatedAt: now() } : c,
    );
    await write(db);
  },
};

export const agentMessages = {
  async listByConversation(conversationId: string) {
    return (await read())
      .agentMessages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  async create(
    conversationId: string,
    input: {
      role: AgentMessage["role"];
      content: string;
      payload?: AgentPayload;
      reasoning?: string;
      credits?: number;
    },
  ) {
    const db = (await read());
    const msg: AgentMessage = {
      id: randomUUID(),
      conversationId,
      role: input.role,
      content: input.content,
      payload: input.payload ?? null,
      reasoning: input.reasoning,
      credits: input.credits ?? 0,
      createdAt: now(),
    };
    db.agentMessages.push(msg);
    await write(db);
    return msg;
  },
  // Credits consumed this month across the workspace's agent conversations.
  async creditsUsedThisMonth(workspaceId: string) {
    const db = (await read());
    const convIds = new Set(
      db.agentConversations.filter((c) => c.workspaceId === workspaceId).map((c) => c.id),
    );
    const prefix = new Date().toISOString().slice(0, 7);
    return db.agentMessages
      .filter((m) => convIds.has(m.conversationId) && m.createdAt.startsWith(prefix))
      .reduce((sum, m) => sum + (m.credits ?? 0), 0);
  },
};
