-- LogLead — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- V1 persistence bridge: the whole app state lives in a single JSON row. This
-- gets LogLead onto a durable database (so it runs on Vercel) with a minimal
-- code change to the data layer. It is intentionally simple.
--
-- ⚠️ Known limitation: because the entire state is one row, two writes that
-- race can lose one update (last-write-wins). Fine for a low-traffic MVP; the
-- proper next step is normalized per-entity tables (users, workspaces, leads…).
-- When we do that, this file is where the real schema will live.

create table if not exists public.app_state (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- The service_role key (used only by the server) bypasses RLS. We still enable
-- RLS and add NO public policies, so the anon/public key can never read or
-- write app data.
alter table public.app_state enable row level security;

-- Seed the singleton row so the first read succeeds.
insert into public.app_state (id, data)
values ('singleton', '{}'::jsonb)
on conflict (id) do nothing;
