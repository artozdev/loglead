import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { decryptField, encryptField } from "./crypto";
import type {
  AgentConversation,
  AgentMessage,
  AgentPayload,
  AlgoInsights,
  ContentAnalysis,
  CmoAction,
  CmoConfig,
  ContentItem,
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
};

function read(): Schema {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Schema>;
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
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

function write(db: Schema): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

const now = () => new Date().toISOString();

// ----- Users ---------------------------------------------------------------

export const users = {
  findByEmail(email: string): User | undefined {
    return read().users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  },
  findById(id: string): User | undefined {
    return read().users.find((u) => u.id === id);
  },
  create(email: string, passwordHash: string): User {
    const db = read();
    const user: User = {
      id: randomUUID(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: now(),
    };
    db.users.push(user);
    write(db);
    return user;
  },
  updatePassword(id: string, passwordHash: string): void {
    const db = read();
    db.users = db.users.map((u) => (u.id === id ? { ...u, passwordHash } : u));
    write(db);
  },
  updateEmailPrefs(id: string, prefs: User["emailPrefs"]): void {
    const db = read();
    db.users = db.users.map((u) =>
      u.id === id ? { ...u, emailPrefs: { ...u.emailPrefs, ...prefs } } : u,
    );
    write(db);
  },
  markEmailVerified(id: string): void {
    const db = read();
    db.users = db.users.map((u) =>
      u.id === id ? { ...u, emailVerifiedAt: now() } : u,
    );
    write(db);
  },
};

// ----- Password resets (one-time tokens, hash only) --------------------------

export const passwordResets = {
  create(userId: string, tokenHash: string): PasswordReset {
    const db = read();
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
    write(db);
    return reset;
  },
  findValid(tokenHash: string): PasswordReset | undefined {
    return read().passwordResets.find(
      (r) => r.tokenHash === tokenHash && r.usedAt === null && r.expiresAt > now(),
    );
  },
  markUsed(id: string): void {
    const db = read();
    db.passwordResets = db.passwordResets.map((r) =>
      r.id === id ? { ...r, usedAt: now() } : r,
    );
    write(db);
  },
};

// ----- Feature waitlist (coming-soon signups) ------------------------------

export const waitlist = {
  isSubscribed(feature: string, email: string): boolean {
    const e = email.toLowerCase();
    return read().featureWaitlist.some(
      (w) => w.feature === feature && w.email.toLowerCase() === e,
    );
  },
  // Idempotent: returns { already: true } if this email is already on the list.
  add(
    feature: string,
    email: string,
    userId: string,
  ): { entry: WaitlistEntry; already: boolean } {
    const db = read();
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
    write(db);
    return { entry, already: false };
  },
};

// ----- Workspaces & members ------------------------------------------------

export const workspaces = {
  listAll(): Workspace[] {
    return read().workspaces;
  },
  create(name: string, ownerId: string): Workspace {
    const db = read();
    const ws: Workspace = {
      id: randomUUID(),
      name,
      ownerId,
      plan: "pro", // demo default — the CMO IA is available out of the box
      createdAt: now(),
    };
    db.workspaces.push(ws);
    db.workspaceMembers.push({
      id: randomUUID(),
      userId: ownerId,
      workspaceId: ws.id,
      role: "owner",
      createdAt: now(),
    });
    write(db);
    return ws;
  },
  findById(id: string): Workspace | undefined {
    return read().workspaces.find((w) => w.id === id);
  },
  rename(id: string, name: string): Workspace | undefined {
    const db = read();
    let updated: Workspace | undefined;
    db.workspaces = db.workspaces.map((w) => {
      if (w.id !== id) return w;
      updated = { ...w, name };
      return updated;
    });
    if (updated) write(db);
    return updated;
  },
  setPlan(id: string, plan: Plan): void {
    const db = read();
    db.workspaces = db.workspaces.map((w) => (w.id === id ? { ...w, plan } : w));
    write(db);
  },
  listForUser(userId: string): Workspace[] {
    const db = read();
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

export const workspaceMembers = {
  add(userId: string, workspaceId: string, role: WorkspaceRole): WorkspaceMember {
    const db = read();
    const member: WorkspaceMember = {
      id: randomUUID(),
      userId,
      workspaceId,
      role,
      createdAt: now(),
    };
    db.workspaceMembers.push(member);
    write(db);
    return member;
  },
  find(userId: string, workspaceId: string): WorkspaceMember | undefined {
    return read().workspaceMembers.find(
      (m) => m.userId === userId && m.workspaceId === workspaceId,
    );
  },
  isMember(userId: string, workspaceId: string): boolean {
    return Boolean(this.find(userId, workspaceId));
  },
  remove(userId: string, workspaceId: string): boolean {
    const db = read();
    const before = db.workspaceMembers.length;
    db.workspaceMembers = db.workspaceMembers.filter(
      (m) => !(m.userId === userId && m.workspaceId === workspaceId),
    );
    if (db.workspaceMembers.length === before) return false;
    write(db);
    return true;
  },
};

// ----- Profiles (workspace-scoped) -----------------------------------------

export type ProfileInput = Omit<
  Profile,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export const profiles = {
  findByWorkspace(workspaceId: string): Profile | undefined {
    return read().profiles.find((p) => p.workspaceId === workspaceId);
  },
  upsert(workspaceId: string, input: ProfileInput): Profile {
    const db = read();
    const existing = db.profiles.find((p) => p.workspaceId === workspaceId);
    if (existing) {
      const updated: Profile = { ...existing, ...input, updatedAt: now() };
      db.profiles = db.profiles.map((p) =>
        p.workspaceId === workspaceId ? updated : p,
      );
      write(db);
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
    write(db);
    return created;
  },
  // ----- Onboarding checklist ----------------------------------------------
  // Idempotent: records a completed step in profile.checklistSteps.
  completeChecklistStep(workspaceId: string, step: string): void {
    const db = read();
    const p = db.profiles.find((x) => x.workspaceId === workspaceId);
    if (!p) return;
    const steps = p.checklistSteps ?? [];
    if (steps.includes(step)) return;
    db.profiles = db.profiles.map((x) =>
      x.workspaceId === workspaceId
        ? { ...x, checklistSteps: [...steps, step], updatedAt: now() }
        : x,
    );
    write(db);
  },
  setChecklistDismissed(workspaceId: string, dismissed: boolean): void {
    const db = read();
    if (!db.profiles.some((x) => x.workspaceId === workspaceId)) return;
    db.profiles = db.profiles.map((x) =>
      x.workspaceId === workspaceId
        ? { ...x, checklistDismissed: dismissed, updatedAt: now() }
        : x,
    );
    write(db);
  },
};

// ----- Onboarding progress (workspace-scoped, per-step autosave) -----------

export const onboardingProgress = {
  get(workspaceId: string): OnboardingProgress | undefined {
    return read().onboardingProgress.find((o) => o.workspaceId === workspaceId);
  },
  upsert(
    workspaceId: string,
    step: number,
    data: Record<string, unknown>,
  ): OnboardingProgress {
    const db = read();
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
      write(db);
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
    write(db);
    return created;
  },
  complete(workspaceId: string): void {
    const db = read();
    db.onboardingProgress = db.onboardingProgress.map((o) =>
      o.workspaceId === workspaceId
        ? { ...o, completedAt: now(), updatedAt: now() }
        : o,
    );
    write(db);
  },
};

// ----- Content items (workspace-scoped) ------------------------------------

export type ContentInput = Pick<
  ContentItem,
  "type" | "platform" | "title" | "body" | "source"
> &
  Partial<Pick<ContentItem, "status" | "scheduledDate" | "scheduledTime">>;

export const contentItems = {
  listByWorkspace(workspaceId: string): ContentItem[] {
    return read()
      .contentItems.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  findById(id: string, workspaceId: string): ContentItem | undefined {
    return read().contentItems.find(
      (c) => c.id === id && c.workspaceId === workspaceId,
    );
  },
  create(workspaceId: string, input: ContentInput): ContentItem {
    const db = read();
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
    write(db);
    return item;
  },
  update(
    id: string,
    workspaceId: string,
    patch: Partial<
      Pick<ContentItem, "title" | "body" | "status" | "scheduledDate" | "scheduledTime">
    >,
  ): ContentItem | undefined {
    const db = read();
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
    write(db);
    return updated;
  },
  remove(id: string, workspaceId: string): boolean {
    const db = read();
    const before = db.contentItems.length;
    db.contentItems = db.contentItems.filter(
      (c) => !(c.id === id && c.workspaceId === workspaceId),
    );
    if (db.contentItems.length === before) return false;
    write(db);
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
  get(workspaceId: string): CmoConfig {
    return (
      read().cmoConfig.find((c) => c.workspaceId === workspaceId) ??
      DEFAULT_CMO_CONFIG(workspaceId)
    );
  },
  upsert(workspaceId: string, patch: Partial<CmoConfig>): CmoConfig {
    const db = read();
    const existing = db.cmoConfig.find((c) => c.workspaceId === workspaceId);
    const base = existing ?? DEFAULT_CMO_CONFIG(workspaceId);
    const updated: CmoConfig = { ...base, ...patch, workspaceId, updatedAt: now() };
    db.cmoConfig = existing
      ? db.cmoConfig.map((c) => (c.workspaceId === workspaceId ? updated : c))
      : [...db.cmoConfig, updated];
    write(db);
    return updated;
  },
};

export const cmoActions = {
  listByWorkspace(workspaceId: string): CmoAction[] {
    return read()
      .cmoActions.filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  findById(id: string, workspaceId: string): CmoAction | undefined {
    return read().cmoActions.find(
      (a) => a.id === id && a.workspaceId === workspaceId,
    );
  },
  create(
    workspaceId: string,
    input: Omit<CmoAction, "id" | "workspaceId" | "createdAt" | "status"> &
      Partial<Pick<CmoAction, "status">>,
  ): CmoAction {
    const db = read();
    const action: CmoAction = {
      id: randomUUID(),
      workspaceId,
      status: input.status ?? "pending",
      createdAt: now(),
      ...input,
    };
    db.cmoActions.push(action);
    write(db);
    return action;
  },
  update(
    id: string,
    workspaceId: string,
    patch: Partial<CmoAction>,
  ): CmoAction | undefined {
    const db = read();
    const existing = db.cmoActions.find(
      (a) => a.id === id && a.workspaceId === workspaceId,
    );
    if (!existing) return undefined;
    const updated: CmoAction = { ...existing, ...patch };
    db.cmoActions = db.cmoActions.map((a) => (a.id === id ? updated : a));
    write(db);
    return updated;
  },
};

// ----- Leads (CRM, email/phone encrypted at rest) --------------------------

export type LeadInput = Omit<
  Lead,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

// Email/phone are decrypted only on the way out of the repo.
function decryptLead(l: Lead): Lead {
  return { ...l, email: decryptField(l.email), phone: decryptField(l.phone) };
}

export const leads = {
  listByWorkspace(workspaceId: string): Lead[] {
    return read()
      .leads.filter((l) => l.workspaceId === workspaceId)
      .map(decryptLead)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  findById(id: string, workspaceId: string): Lead | undefined {
    const l = read().leads.find(
      (x) => x.id === id && x.workspaceId === workspaceId,
    );
    return l ? decryptLead(l) : undefined;
  },
  create(workspaceId: string, input: LeadInput): Lead {
    const db = read();
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
    write(db);
    return decryptLead(lead);
  },
  update(
    id: string,
    workspaceId: string,
    patch: Partial<LeadInput>,
  ): Lead | undefined {
    const db = read();
    const existing = db.leads.find(
      (l) => l.id === id && l.workspaceId === workspaceId,
    );
    if (!existing) return undefined;
    const next: Lead = { ...existing, ...patch, updatedAt: now() };
    if ("email" in patch) next.email = encryptField(patch.email);
    if ("phone" in patch) next.phone = encryptField(patch.phone);
    db.leads = db.leads.map((l) => (l.id === id ? next : l));
    write(db);
    return decryptLead(next);
  },
  remove(id: string, workspaceId: string): boolean {
    const db = read();
    const before = db.leads.length;
    db.leads = db.leads.filter(
      (l) => !(l.id === id && l.workspaceId === workspaceId),
    );
    if (db.leads.length === before) return false;
    db.leadEvents = db.leadEvents.filter((e) => e.leadId !== id);
    write(db);
    return true;
  },
};

// ----- Algo Insider (one cached guide per workspace) -----------------------

export const algoInsights = {
  get(workspaceId: string): AlgoInsights | undefined {
    return read().algoInsights.find((a) => a.workspaceId === workspaceId);
  },
  upsert(workspaceId: string, data: Omit<AlgoInsights, "workspaceId">): AlgoInsights {
    const db = read();
    const record: AlgoInsights = { workspaceId, ...data };
    const exists = db.algoInsights.some((a) => a.workspaceId === workspaceId);
    db.algoInsights = exists
      ? db.algoInsights.map((a) => (a.workspaceId === workspaceId ? record : a))
      : [...db.algoInsights, record];
    write(db);
    return record;
  },
};

// ----- Content analyses (history per workspace) ----------------------------

export const contentAnalyses = {
  listByWorkspace(workspaceId: string): ContentAnalysis[] {
    return read()
      .contentAnalyses.filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  create(
    workspaceId: string,
    input: Omit<ContentAnalysis, "id" | "workspaceId" | "createdAt">,
  ): ContentAnalysis {
    const db = read();
    const record: ContentAnalysis = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
    };
    db.contentAnalyses.push(record);
    write(db);
    return record;
  },
};

// ----- IA Visibility scans (workspace-scoped) -------------------------------

export const visibilityScans = {
  // Newest first.
  listByWorkspace(workspaceId: string): VisibilityScan[] {
    return read()
      .visibilityScans.filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  countThisMonth(workspaceId: string): number {
    const prefix = new Date().toISOString().slice(0, 7);
    return read().visibilityScans.filter(
      (s) => s.workspaceId === workspaceId && s.createdAt.startsWith(prefix),
    ).length;
  },
  create(
    workspaceId: string,
    input: Omit<VisibilityScan, "id" | "workspaceId" | "createdAt">,
  ): VisibilityScan {
    const db = read();
    const scan: VisibilityScan = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
    };
    db.visibilityScans.push(scan);
    write(db);
    return scan;
  },
};

export const leadEvents = {
  listByLead(leadId: string): LeadEvent[] {
    return read()
      .leadEvents.filter((e) => e.leadId === leadId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  create(
    leadId: string,
    type: LeadEventType,
    data: Record<string, unknown> = {},
  ): LeadEvent {
    const db = read();
    const event: LeadEvent = {
      id: randomUUID(),
      leadId,
      type,
      data,
      createdAt: now(),
    };
    db.leadEvents.push(event);
    write(db);
    return event;
  },
};

// ----- Lead score config (one weight set per workspace) --------------------

export const leadScoreConfig = {
  get(workspaceId: string): LeadScoreConfig | undefined {
    return read().leadScoreConfig.find((c) => c.workspaceId === workspaceId);
  },
  upsert(workspaceId: string, weights: LeadScoreWeights): LeadScoreConfig {
    const db = read();
    const record: LeadScoreConfig = { workspaceId, weights, updatedAt: now() };
    const exists = db.leadScoreConfig.some((c) => c.workspaceId === workspaceId);
    db.leadScoreConfig = exists
      ? db.leadScoreConfig.map((c) => (c.workspaceId === workspaceId ? record : c))
      : [...db.leadScoreConfig, record];
    write(db);
    return record;
  },
};

// ----- Campaigns (multichannel distribution) -------------------------------

export const campaigns = {
  listByWorkspace(workspaceId: string): Campaign[] {
    return read()
      .campaigns.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  findById(id: string, workspaceId: string): Campaign | undefined {
    return read().campaigns.find((c) => c.id === id && c.workspaceId === workspaceId);
  },
  create(workspaceId: string, input: Omit<Campaign, "id" | "workspaceId" | "createdAt">): Campaign {
    const db = read();
    const campaign: Campaign = {
      id: randomUUID(),
      workspaceId,
      ...input,
      createdAt: now(),
    };
    db.campaigns.push(campaign);
    write(db);
    return campaign;
  },
  update(id: string, workspaceId: string, patch: Partial<Campaign>): Campaign | undefined {
    const db = read();
    const existing = db.campaigns.find((c) => c.id === id && c.workspaceId === workspaceId);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    db.campaigns = db.campaigns.map((c) => (c.id === id ? next : c));
    write(db);
    return next;
  },
  remove(id: string, workspaceId: string): boolean {
    const db = read();
    const before = db.campaigns.length;
    db.campaigns = db.campaigns.filter((c) => !(c.id === id && c.workspaceId === workspaceId));
    if (db.campaigns.length === before) return false;
    write(db);
    return true;
  },
};

// ----- LogReach — conversations & messages -----------------------------------

export const conversations = {
  listByWorkspace(workspaceId: string): Conversation[] {
    return read()
      .conversations.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) =>
        (b.lastMessageAt ?? b.createdAt) < (a.lastMessageAt ?? a.createdAt) ? -1 : 1,
      );
  },
  findById(id: string, workspaceId: string): Conversation | undefined {
    return read().conversations.find(
      (c) => c.id === id && c.workspaceId === workspaceId,
    );
  },
  findByLead(leadId: string, workspaceId: string): Conversation | undefined {
    return read().conversations.find(
      (c) => c.leadId === leadId && c.workspaceId === workspaceId,
    );
  },
  create(workspaceId: string, leadId: string): Conversation {
    const db = read();
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
    write(db);
    return conv;
  },
  setStatus(id: string, status: ConversationStatus): void {
    const db = read();
    db.conversations = db.conversations.map((c) =>
      c.id === id ? { ...c, status } : c,
    );
    write(db);
  },
  touch(id: string): void {
    const db = read();
    db.conversations = db.conversations.map((c) =>
      c.id === id ? { ...c, lastMessageAt: now() } : c,
    );
    write(db);
  },
};

export const inboxMessages = {
  listByConversation(conversationId: string): InboxMessage[] {
    return read()
      .inboxMessages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1));
  },
  // All messages of a workspace (for the monthly quota + metrics).
  listByWorkspace(workspaceId: string): InboxMessage[] {
    const convIds = new Set(
      read().conversations.filter((c) => c.workspaceId === workspaceId).map((c) => c.id),
    );
    return read().inboxMessages.filter((m) => convIds.has(m.conversationId));
  },
  create(
    conversationId: string,
    input: Pick<InboxMessage, "direction" | "content" | "isAiGenerated">,
  ): InboxMessage {
    const db = read();
    const msg: InboxMessage = {
      id: randomUUID(),
      conversationId,
      ...input,
      sentAt: now(),
      readAt: input.direction === "outbound" ? now() : null,
    };
    db.inboxMessages.push(msg);
    write(db);
    return msg;
  },
};

// ----- Segments (criteria-derived membership) --------------------------------

export const segments = {
  listByWorkspace(workspaceId: string): Segment[] {
    return read()
      .segments.filter((sg) => sg.workspaceId === workspaceId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  findById(id: string, workspaceId: string): Segment | undefined {
    return read().segments.find((sg) => sg.id === id && sg.workspaceId === workspaceId);
  },
  create(
    workspaceId: string,
    input: {
      name: string;
      description?: string;
      type: SegmentType;
      criteria: SegmentCriteria;
      logreachLinked?: boolean;
    },
  ): Segment {
    const db = read();
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
    write(db);
    return seg;
  },
  update(
    id: string,
    workspaceId: string,
    patch: Partial<Pick<Segment, "name" | "description" | "criteria" | "isArchived" | "logreachLinked">>,
  ): Segment | undefined {
    const db = read();
    const existing = db.segments.find((sg) => sg.id === id && sg.workspaceId === workspaceId);
    if (!existing) return undefined;
    const updated: Segment = { ...existing, ...patch };
    db.segments = db.segments.map((sg) => (sg.id === id ? updated : sg));
    write(db);
    return updated;
  },
  remove(id: string, workspaceId: string): boolean {
    const db = read();
    const before = db.segments.length;
    db.segments = db.segments.filter((sg) => !(sg.id === id && sg.workspaceId === workspaceId));
    if (db.segments.length === before) return false;
    write(db);
    return true;
  },
};

// ----- LogAgent (conversations + messages + credit ledger) -------------------

export const agentConversations = {
  listByWorkspace(workspaceId: string): AgentConversation[] {
    return read()
      .agentConversations.filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)); // newest first
  },
  findById(id: string, workspaceId: string): AgentConversation | undefined {
    return read().agentConversations.find((c) => c.id === id && c.workspaceId === workspaceId);
  },
  create(workspaceId: string, title: string): AgentConversation {
    const db = read();
    const conv: AgentConversation = {
      id: randomUUID(),
      workspaceId,
      title,
      createdAt: now(),
      updatedAt: now(),
    };
    db.agentConversations.push(conv);
    write(db);
    return conv;
  },
  touch(id: string): void {
    const db = read();
    db.agentConversations = db.agentConversations.map((c) =>
      c.id === id ? { ...c, updatedAt: now() } : c,
    );
    write(db);
  },
};

export const agentMessages = {
  listByConversation(conversationId: string): AgentMessage[] {
    return read()
      .agentMessages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  create(
    conversationId: string,
    input: {
      role: AgentMessage["role"];
      content: string;
      payload?: AgentPayload;
      reasoning?: string;
      credits?: number;
    },
  ): AgentMessage {
    const db = read();
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
    write(db);
    return msg;
  },
  // Credits consumed this month across the workspace's agent conversations.
  creditsUsedThisMonth(workspaceId: string): number {
    const db = read();
    const convIds = new Set(
      db.agentConversations.filter((c) => c.workspaceId === workspaceId).map((c) => c.id),
    );
    const prefix = new Date().toISOString().slice(0, 7);
    return db.agentMessages
      .filter((m) => convIds.has(m.conversationId) && m.createdAt.startsWith(prefix))
      .reduce((sum, m) => sum + (m.credits ?? 0), 0);
  },
};
