import "server-only";
import { NextResponse } from "next/server";
import { CREDIT_COSTS, type CreditAction } from "./credits";
import { credits } from "./db";

// Atomically charge the workspace for an action. Returns { ok:false } (nothing
// debited) when the balance is insufficient — callers should bail out before
// doing the work and return `insufficientResponse`.
export async function spend(workspaceId: string, action: CreditAction) {
  const needed = CREDIT_COSTS[action];
  const res = await credits.consume(workspaceId, action, needed);
  return { ok: res.ok, balance: res.balance, needed };
}

// 402 payload the client blocking modal understands.
export function insufficientResponse(action: CreditAction, balance: number) {
  return NextResponse.json(
    { error: "insufficient_credits", action, needed: CREDIT_COSTS[action], balance },
    { status: 402 },
  );
}
