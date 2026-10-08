# Alvora Web

AI Builder Identity & Validation Platform — Next.js frontend for Alvora.

## Sprint 1 — Authentication & Profile Management

| Feature | Route / behavior |
|---|---|
| Registration | `/register` |
| Email login | `/login` |
| Logout | Header action |
| Password reset | `/forgot-password` → email → `/reset-password` |
| Protected routes | `/dashboard`, `/profile/*` (middleware) |
| Profile create/edit | `/profile/edit` |
| Public profiles | `/u/[username]` |

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + ShadCN UI
- Supabase Auth + PostgreSQL (`profiles`)

## Setup

1. Copy env vars:

```bash
cp .env.example .env.local
```

2. Fill in Supabase URL, anon key, and site URL.

3. In Supabase Auth settings, add redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://YOUR_DOMAIN/auth/callback`

4. Ensure the `profiles` table matches `supabase/migrations/20261008_profiles.sql` (or run that SQL if the table is missing).

5. Install and run:

```bash
npm install
npm run dev
```

## Architecture

- **Middleware** refreshes the Supabase session and gates protected routes.
- **Server Actions** handle auth + profile writes with Zod validation.
- **Browser client** is only used where needed; forms call server actions.
- **RLS** allows public profile reads and owner-only writes.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
