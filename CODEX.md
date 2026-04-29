# Gryphon Hub Codex Instructions

Gryphon Hub is an installable PWA for Gryphon Railways, the University of Leeds student railway engineering team.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security
- OneSignal later for push notifications
- PWA installability required for iOS and Android

## Architecture rules

- Use Server Components by default.
- Use Client Components only where interactivity is required.
- Do not use the Supabase service role key in client-side code.
- Use the typed Supabase clients in `lib/supabase`.
- Use generated database types from `lib/supabase/database.types.ts`.
- Do not invent new database tables without asking.
- Use the existing table names exactly.
- Keep layouts mobile-first.
- Keep UI clean, practical, and suitable for an engineering operations app.

## Core modules

- Dashboard
- Fault reporting
- Testing logbook
- Safety/document hub
- Competition checklists
- Onboarding
- Telemetry dashboard later
- Admin/user management

## Roles

- admin
- exec
- team_lead
- member
- viewer

## Sub-teams

- structures
- powertrain
- vehicle_systems
- manufacturing_testing
- systems_engineering
- business_ops

## Security

- Respect Supabase RLS.
- Never bypass RLS from client code.
- Use server-side logic for privileged actions.
- Safety-critical document approval should be limited to exec/admin workflows.
- Push notification sending must happen server-side only.

## Database context

Read `docs/database.md` before making database-related changes.