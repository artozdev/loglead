import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { PLAN_MONTHLY_CREDITS, PLAN_PRICE_MONTHLY, subscriptionAmountCents } from "@/lib/credits";
import { workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
  billing: z.enum(["monthly", "annual"]).optional().default("monthly"),
});

// Subscribe to a paid plan via Stripe Checkout (subscription mode, price built
// on the fly — no pre-created Price IDs needed). When STRIPE_SECRET_KEY is
// absent we run in demo mode and activate the subscription immediately.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }
  const { plan, billing } = parsed.data;
  const monthlyCredits = PLAN_MONTHLY_CREDITS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const secret = process.env.STRIPE_SECRET_KEY;

  // ----- Demo mode (no Stripe key) -----
  if (!secret) {
    await workspaces.activateSubscription(ctx.workspace.id, plan, monthlyCredits);
    return NextResponse.json({
      url: `${appUrl}/dashboard?subscribed=${plan}`,
      demo: true,
    });
  }

  // ----- Real Stripe Checkout (subscription) -----
  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `LogLead ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
              description: `${monthlyCredits.toLocaleString("fr-FR")} crédits/mois · abonnement ${billing === "annual" ? "annuel" : "mensuel"}`,
              // Required by Stripe Managed Payments (auto-VAT). SaaS, business use.
              tax_code: process.env.STRIPE_TAX_CODE || "txcd_10103001",
            },
            unit_amount: subscriptionAmountCents(plan, billing),
            recurring: { interval: billing === "annual" ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?subscribed=${plan}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: {
        workspace_id: ctx.workspace.id,
        plan,
        monthly_credits: String(monthlyCredits),
        type: "subscription",
      },
      subscription_data: {
        metadata: { workspace_id: ctx.workspace.id, plan },
      },
      customer_email: ctx.user.email,
    });
    if (!session.url) throw new Error("no url");
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Le paiement a échoué. Réessaie dans un instant." },
      { status: 502 },
    );
  }
}

// Expose the pricing so the client can label buttons without duplicating it.
export function GET() {
  return NextResponse.json({ prices: PLAN_PRICE_MONTHLY });
}
