import { NextResponse } from "next/server";
import Stripe from "stripe";
import { credits } from "@/lib/db";

// Signature verification needs the raw body + Node runtime; never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook — credits the workspace after a successful top-up. Idempotent:
// `credits.add` skips a payment_intent it has already recorded (Part 9, rule 7).
// Dormant until STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are configured.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const body = await req.text(); // raw body required for signature verification

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const workspaceId = s.metadata?.workspace_id;
    const amount = parseInt(s.metadata?.credits ?? "0", 10);
    const paymentIntent = typeof s.payment_intent === "string" ? s.payment_intent : null;
    if (workspaceId && amount > 0) {
      await credits.add(workspaceId, amount, {
        type: "purchase",
        amountEur: (s.amount_total ?? amount) / 100,
        stripePaymentIntent: paymentIntent,
      });
    }
  }

  return NextResponse.json({ received: true });
}
