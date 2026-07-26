import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { users } from "@/lib/db";

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // confirmation links live 24h

// GET /api/auth/confirm?token=… — marks the email verified then lands on the
// dashboard. Invalid/expired links go back to login with no side effect.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const value = verifyToken(url.searchParams.get("token") ?? undefined);
  const [purpose, userId, ts] = value?.split(":") ?? [];

  if (
    purpose === "confirm" &&
    userId &&
    Date.now() - Number(ts) <= MAX_AGE_MS &&
    await users.findById(userId)
  ) {
    await users.markEmailVerified(userId);
    return NextResponse.redirect(new URL("/dashboard", url.origin));
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}
