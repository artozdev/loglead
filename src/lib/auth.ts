import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { users } from "./db";
import type { User } from "./types";

// ---------------------------------------------------------------------------
// Lightweight, dependency-free auth for the local-first MVP.
//
//  - Passwords hashed with Node's built-in scrypt ("salt:hash").
//  - Session = httpOnly cookie holding the userId, signed with HMAC-SHA256.
//
// Kept isolated so Supabase Auth / Clerk can replace it later without touching
// feature code: routes only call signIn / signOut / getCurrentUser.
// ---------------------------------------------------------------------------

const COOKIE_NAME = "loglead_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return (
    process.env.SESSION_SECRET ||
    "loglead-dev-secret-change-me-in-production-0051FF"
  );
}

// ----- Password hashing ----------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ----- Session token (HMAC signed) -----------------------------------------

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

// Generic signed-cookie value (reused for the session and the active workspace).
export function makeToken(value: string): string {
  const payload = Buffer.from(value).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

// ----- Public API ----------------------------------------------------------

export async function signIn(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const userId = verifyToken(store.get(COOKIE_NAME)?.value);
  if (!userId) return null;
  return users.findById(userId) ?? null;
}

export { COOKIE_NAME };
