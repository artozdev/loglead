"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client used ONLY to run Google OAuth (identity). We use
// the implicit flow so the access token comes back in the URL hash and is read
// on the client — no @supabase/ssr / PKCE cookie plumbing needed. Once we have
// the Google identity, the app mints its own `loglead_session` cookie (see
// /api/auth/google); we do not use the Supabase session for anything else.

let client: SupabaseClient | null = null;

// True when the public Supabase env is present so Google auth can run. NEXT_PUBLIC
// vars are inlined at build time, so this is a real client-side check.
export function hasGoogleAuth(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  client = createClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: false,
    },
  });
  return client;
}
