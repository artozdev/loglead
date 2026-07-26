import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase server client (service role — full access, server-only).
//
// Set in .env.local / Vercel:
//   NEXT_PUBLIC_SUPABASE_URL      = https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     = the service_role key (NEVER expose client-side)
//
// This client bypasses Row Level Security, so it must only ever be imported
// from server code (guarded by "server-only").
// ---------------------------------------------------------------------------

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase non configuré : renseigne NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local.",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ----- App-state KV bridge --------------------------------------------------
// V1 persistence bridge: the whole app state (the current JSON store shape) is
// held in a single `app_state` row. This lets the data layer move to Supabase
// with minimal logic rewrite — db.ts keeps its in-memory operations and only
// swaps its file read/write for these. Normalizing into per-entity tables is a
// later step (see supabase/schema.sql).
const STATE_ID = "singleton";

export async function readState<T>(): Promise<T | null> {
  const { data, error } = await supabase()
    .from("app_state")
    .select("data")
    .eq("id", STATE_ID)
    .maybeSingle();
  if (error) throw new Error(`Supabase readState: ${error.message}`);
  return (data?.data as T) ?? null;
}

export async function writeState<T>(state: T): Promise<void> {
  const { error } = await supabase()
    .from("app_state")
    .upsert({ id: STATE_ID, data: state, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Supabase writeState: ${error.message}`);
}
