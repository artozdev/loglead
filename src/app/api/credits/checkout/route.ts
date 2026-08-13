import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { CREDIT_MAX, CREDIT_MIN, creditsPrice, normalizeCredits } from "@/lib/credits";
import { credits } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// Stripe + the JSON store need the Node runtime, and the balance mutation must
// never be cached/prerendered.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ credits: z.number().int().min(CREDIT_MIN).max(CREDIT_MAX) });

// Buy a credit top-up. When STRIPE_SECRET_KEY is configured we create a real
// Checkout session; otherwise we run in demo mode and credit the workspace
// immediately (mirrors the app's demo-mode philosophy — set live keys in Vercel
// to enable real payments). 1 credit = 1 cent.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Montant de crédits invalide" }, { status: 400 });
  }

  const amount = normalizeCredits(parsed.data.credits);
  const priceEur = creditsPrice(amount);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const secret = process.env.STRIPE_SECRET_KEY;

  // ----- Demo mode (no Stripe key) -----
  if (!secret) {
    await credits.add(ctx.workspace.id, amount, {
      type: "purchase",
      amountEur: priceEur,
      stripePaymentIntent: `demo_${Date.now()}_${amount}`,
    });
    return NextResponse.json({
      url: `${appUrl}/dashboard?credits_purchased=${amount}`,
      demo: true,
    });
  }

  // ----- Real Stripe Checkout -----
  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `LogLead — ${amount.toLocaleString("fr-FR")} crédits`,
              description: `${amount.toLocaleString("fr-FR")} crédits LogLead · sans expiration`,
            },
            unit_amount: amount, // 1 credit = 1 cent
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/dashboard?credits_purchased=${amount}`,
      cancel_url: `${appUrl}/dashboard?credits_cancelled=true`,
      metadata: { workspace_id: ctx.workspace.id, credits: String(amount), type: "credit_topup" },
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
