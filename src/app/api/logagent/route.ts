import { NextResponse } from "next/server";
import { z } from "zod";
import { detectAction, runAgent } from "@/lib/agent";
import { agentConversations, agentMessages, profiles } from "@/lib/db";
import { firstNameFromEmail } from "@/lib/emails/send";
import { planAllows } from "@/lib/plan";
import { rateLimit } from "@/lib/ratelimit";
import { AGENT_CREDIT_COSTS, AGENT_MONTHLY_QUOTA } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  // nullish: the client sends `null` for a brand-new conversation.
  conversationId: z.string().nullish(),
  message: z.string().min(1, "Message vide.").max(2000),
});

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

// Renewal date shown when credits run out (1st of next month).
function renewalDate(): string {
  const d = new Date();
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    new Date(d.getFullYear(), d.getMonth() + 1, 1),
  );
}

// GET — conversation list (history drawer) or one conversation's messages.
export async function GET(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "agent")) {
    return NextResponse.json({ error: "LogAgent est réservé au plan Pro." }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("conversationId");
  const used = await agentMessages.creditsUsedThisMonth(ctx.workspace.id);

  if (id) {
    const conv = await agentConversations.findById(id, ctx.workspace.id);
    if (!conv) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
    return NextResponse.json({
      conversation: conv,
      messages: await agentMessages.listByConversation(id),
      credits: { used, quota: AGENT_MONTHLY_QUOTA },
    });
  }

  return NextResponse.json({
    conversations: (await agentConversations.listByWorkspace(ctx.workspace.id)).map((c) => ({
      ...c,
      // Preview = first user message of the thread.
      preview: (await agentMessages.listByConversation(c.id)).find((m) => m.role === "user")?.content ?? c.title,
    })),
    credits: { used, quota: AGENT_MONTHLY_QUOTA },
  });
}

// POST — send a message; routes to a tool, charges credits, persists both turns.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "agent")) {
    return NextResponse.json({ error: "LogAgent est réservé au plan Pro." }, { status: 403 });
  }
  if (!rateLimit(`agent:${ctx.workspace.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop de messages d'affilée — patiente un instant." }, { status: 429 });
  }

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json({ error: "Complète d'abord ton profil SaaS." }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }
  const { message } = parsed.data;

  // Credit check before doing any work.
  const used = await agentMessages.creditsUsedThisMonth(ctx.workspace.id);
  const cost = AGENT_CREDIT_COSTS[detectAction(message)];
  if (used + cost > AGENT_MONTHLY_QUOTA) {
    return NextResponse.json(
      {
        error: `Tu n'as plus assez de crédits pour cette action. Ils se renouvellent le ${renewalDate()}.`,
        credits: { used, quota: AGENT_MONTHLY_QUOTA },
      },
      { status: 403 },
    );
  }

  const conv =
    (parsed.data.conversationId
      ? await agentConversations.findById(parsed.data.conversationId, ctx.workspace.id)
      : undefined) ?? await agentConversations.create(ctx.workspace.id, truncate(message, 60));

  await agentMessages.create(conv.id, { role: "user", content: message });

  try {
    const result = await runAgent({
      workspaceId: ctx.workspace.id,
      profile,
      firstName: firstNameFromEmail(ctx.user.email),
      message,
    });
    const charged = AGENT_CREDIT_COSTS[result.action];
    const assistant = await agentMessages.create(conv.id, {
      role: "assistant",
      content: result.content,
      payload: result.payload,
      reasoning: result.reasoning,
      credits: charged,
    });
    await agentConversations.touch(conv.id);

    return NextResponse.json({
      conversationId: conv.id,
      message: assistant,
      credits: { used: used + charged, quota: AGENT_MONTHLY_QUOTA },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LogAgent n'a pas pu répondre." },
      { status: 502 },
    );
  }
}
