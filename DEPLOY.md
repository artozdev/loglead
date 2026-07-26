# Deploying LogLead (Vercel + Supabase)

This is the runbook. Do the steps that are **yours** (accounts / secrets); the
code side is already prepared. **Never paste secrets into chat** — put them in
`.env.local` (git-ignored) and in Vercel's env settings.

---

## ⚠️ Status: not production-ready to deploy yet

LogLead still stores data in a local JSON file (`data/loglead.json`). That works
locally but **not on Vercel** (its filesystem is ephemeral — every write would
be lost). The remaining engineering step is converting the data layer
(`src/lib/db.ts`) to read/write Supabase instead of the file. Foundation done:
Supabase client (`src/lib/supabase.ts`), the schema, env plumbing, this runbook.

**Do the Supabase + GitHub setup below now; hold the Vercel deploy until the DB
conversion lands and we've verified writes persist locally.**

---

## 1. Supabase (you)

1. In your Supabase project → **SQL Editor** → paste and run
   [`supabase/schema.sql`](supabase/schema.sql). It creates the `app_state`
   table and enables RLS.
2. **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only)

## 2. Local env (you)

```bash
cp .env.local.example .env.local
```
Fill in at minimum: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SESSION_SECRET` (any long random string), and `ANTHROPIC_API_KEY` if you want
real generation. Then:
```bash
npm install
npm run dev
```
Once the DB conversion is in, we verify here that data persists in Supabase.

## 3. GitHub (you)

The repo is already `git init`-ed with a safe `.gitignore` (excludes
`.env.local`, `/data`, `.next`, `node_modules`). Create an **empty** GitHub repo,
then:
```bash
git remote add origin git@github.com:<you>/loglead.git
git branch -M main
git push -u origin main
```

## 4. Vercel (you)

1. **Add New → Project → Import** your GitHub repo. Framework auto-detects Next.js.
2. **Settings → Environment Variables** — add (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`, `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL (e.g. `https://loglead.vercel.app`)
   - `CRON_SECRET` (any long random string — protects `/api/cron/*`)
   - Optional: `RESEND_API_KEY`, the IA-Visibility provider keys, LinkedIn keys.
3. Deploy. The crons in [`vercel.json`](vercel.json) register automatically.

---

## Still to build (engineering, tracked)

- **Data layer → Supabase** (`src/lib/db.ts`): the ~227 call sites become async;
  verified against your live Supabase before flipping Vercel to production.
- **Normalized tables** (later): replace the single-row `app_state` bridge with
  real per-entity tables to remove the last-write-wins limitation.
- **LinkedIn integration**: OAuth + posting/enrichment (the API key you have has
  no code to plug into yet).
