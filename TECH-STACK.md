# Inverbras Defence CRM — TECH-STACK.md (v2)

> Intended destination: `D:\FWAI\projects\InverBase\TECH-STACK.md`. Saved here because plan mode
> permits writes only inside the plan directory; an implementation-capable agent should copy this
> file to the project root unchanged.

## What changed, and what it costs

v1 was built to the four "fixed" constraints: localhost, no backend, no database server, no auth. This
revision follows the client's own brief instead — **Next.js + hosted Postgres (Supabase) with auth** —
so those four constraints are now superseded, not merely relaxed. The costs are real and must be accepted
before build:

- **The offline guarantee is gone.** A shared hosted database needs the network, so "runs on hotel wifi"
  becomes "degrades gracefully, and demos offline against a local Supabase stack".
- **Defence/tender data leaves the laptop.** Both mitigations are locked: the Supabase project is in Mumbai (`ap-south-1`) so data stays in India, and the assistant reads structured fields only, never tender documents.
- **Auth brings secrets and account lifecycle.** The service-role key must never reach the browser.
- **"No deployment step" is gone.** Deploys now exist; an exposed Vercel deployment-protection login will
  break the shared demo link (a known failure in the sibling project).
- **Retained from v1:** the app stays usable when every AI provider is down (AI is optional and never on
  the save path), and it stays agent-literal (migrations, generated types and tests give the agent
  checkable contracts).

Constraints referenced below: **B1** the client's own brief (Next.js, Postgres via Supabase/Neon, auth).
**P** a PRD requirement (state which). **R1** defence data sensitivity. **R2** built by an agent from a
written brief. **R3** maintainable by a less-experienced person. **R4** phone + laptop. **R5** usable when
every AI provider is rate limited or down. **R6** unreliable / hotel wifi.

## Stack

| LAYER | CHOICE | THE CONSTRAINT THAT FORCED IT |
|---|---|---|
| App framework | Next.js, App Router, pinned to a current stable version | B1; R2: one framework and typed boundaries an agent can follow literally |
| Language | TypeScript, strict | R2/R3: generated DB types and schemas catch the agent's mistakes before runtime |
| UI components | Tailwind CSS + shadcn/ui (components copied into the repo, so you own them) | P: seven form-heavy modules; R4 responsive; R3 keeps the components in-repo and readable |
| Forms and validation | React Hook Form + Zod, with the same Zod schemas reused server-side | P: up-to-500-line-item forms and hard field rules; R2: one schema enforced in both places |
| Data and auth platform | Supabase — Postgres + Auth + Storage + Row Level Security | B1; P: 15-20 shared users, five roles, approvals and audit need a real shared DB and real identities |
| Data access | Supabase server client via `@supabase/ssr` in Server Components and Server Actions, with generated types | R2: no ORM between app and DB, so RLS is the one enforcement boundary an agent can reason about |
| Schema and migrations | Supabase CLI migrations committed to git; types regenerated with `supabase gen types typescript` | R2/R3: handoff needs schema in version control, never dashboard-only changes |
| Authorization | Postgres RLS policies keyed to a `user_roles` table, with Group Head and Management as separate approver roles; two sequential approval gates per stage on quotes, OEM selection and orders; private Storage buckets with signed URLs | P: role permissions and two-level stage-gate approvals; R1: data must not leak across roles |
| Business rules | Pure TypeScript rule modules, plus DB constraints/functions for hard rules (commission only after OEM paid; a PO requires an approved quotation; quantity coverage; a stage advances only after both approval levels are recorded in order) | P: the rules that must never be silently relaxed; R2: a client bug cannot bypass a DB constraint |
| AI / plain-language queries | Provider-agnostic server route, off by default; deterministic structured queries run with no AI; the model reads structured fields only and never raw tender documents | R5: no provider is load-bearing; R1: tender documents never leave the Supabase instance |
| Document vault | Supabase Storage, private buckets, metadata rows linked to the PO (and through it the RFI/OEM) | P: every document traces to the PO that required it; R1 |
| Reminders | In-app due/overdue views computed on load (MVP); Vercel Cron + an email provider only in Phase 2, off by default | P keeps messaging optional; R5: no third party on the critical path |
| Authentication flow | Supabase Auth, email + password, invite-only, public signup disabled; middleware refreshes the session | B1; P: internal users only, no OEM or government-side logins |
| Hosting | Vercel | B1; tightest Next.js App Router and cron integration |
| Region | Supabase project in Mumbai (`ap-south-1`) | R1: defence data must stay in India, and Mumbai is the in-India region (locked) |
| Local dev and demo | `supabase start` local stack + `next dev` on localhost; `.env.local` points at local URLs; seeded demo data | R6: hotel-wifi demo and offline development without touching production |
| Secrets | Server-only environment variables in Vercel; only the anon/publishable key in the browser; service-role key never `NEXT_PUBLIC_` | AGENTS.md §8; R1 |
| Dates, money, timezone | Store `timestamptz` in UTC; render `Asia/Kolkata`; `Intl` for INR | P: deadlines, document expiry and LD-risk are IST-day math |
| Tests | Vitest for rule and Zod modules; SQL-level tests for RLS policies; Playwright for two or three critical flows (sign-in, RFI to quote to approval) | R2/R3: the agent must prove each slice; P: approvals and audit must be correct |
| Observability | Vercel logs + Supabase logs only, no extra APM | R3: keep the surface small for handoff |

## Rejected alternatives (one line each)

- **Neon** — genuinely close and better serverless Postgres, but it is Postgres only: you would bolt on auth (Clerk/NextAuth) and file storage separately, more moving parts to hand off. Picked Supabase as the single platform.
- **Clerk / NextAuth** — redundant once Supabase Auth is in and pairing with RLS; one fewer vendor and one fewer secret.
- **Prisma / Drizzle ORM** — Supabase client plus generated types is already typed, and an ORM hides RLS and adds migration surface an agent must keep in sync.
- **Firebase** — NoSQL, weak joins for the RFI → quotation → PO → invoice → coverage model.
- **MUI / Ant Design** — heavier runtime and harder to bend to government-format documents; shadcn/ui is copied in and owned.
- **Redux / MobX** — Server Components and Server Actions cover this app's state; an extra dependency with no payoff.
- **Bare CSS / CSS-in-JS** — too slow to build seven form modules; Tailwind + shadcn/ui wins.
- **Always-on cloud LLM** — violates R5 and leaks tender data to a third party.
- **Offline-first sync (PouchDB/CRDT)** — out of scope for MVP; it creates a second source of truth and a conflict-resolution problem the PRD never asked for.
- **Netlify** — viable, but Vercel's Next.js App Router and cron story is closer to zero-config.

## Dependency flags

- **Supabase (hosted)** — platform lock-in risk. Mitigated by keeping schema in migration files and using plain Postgres, so the data can move to self-hosted Supabase or Neon later. Pin the client library.
- **shadcn/ui** — not a live dependency: the components are copied into the repo, so you own and can freeze them. It pulls Radix primitives; pin those versions.
- **Tailwind CSS** — pin the version; it has had recent major rewrites and the app should not chase them.
- **Next.js** — fast-moving majors; pin a stable version and do not track canary or `latest`.
- **Playwright** — heavier than this job needs; keep it to two or three flows, or drop it if it slows the agent. Do not let it become a maintenance burden.
- **`@supabase/ssr` / `@supabase/supabase-js`** — pin both; the SSR helper's API has changed across releases.
- No touch-support concerns in the chosen UI libraries (Radix is good on touch), but R4 still requires testing on a real phone.

## HARD EXCLUSIONS

- **No second data store and no raw `pg` client that bypasses RLS.** One access path keeps the security model auditable.
- **No service-role key in client code, in `NEXT_PUBLIC_*`, or in the repo.** AGENTS.md §8.
- **No dashboard-only schema changes.** Every schema change is a migration file committed to git.
- **No ORM that obscures RLS** (Prisma, Drizzle, TypeORM).
- **No public signup, no OEM or government-side logins.** PRD: internal users only.
- **No AI on the write/save path**, and **no tender documents sent to a third-party LLM** without the client's written approval.
- **No AI provider as a single point of failure.** Structured queries must never require a model.
- **No `localStorage` for records** (session UI state at most); records live in Postgres.
- **No offline-first sync or CRDT layer in MVP.**
- **No outbound email/SMS/WhatsApp on the critical path in MVP**, and no GeM-portal automation.
- **No accounting/general-ledger features.** PRD marks full ERP replacement out of scope.
- **No native mobile app or Electron/Tauri shell.** A responsive web app covers R4.
- **No Redux/MobX or other global state library.**
- **No public Storage buckets.** Documents are private, reached by signed URL only.
- **No secrets, `.env*` files, or keys committed to the repo.**

## Decisions locked (refinement round)

- **Offline behaviour:** network required. The app assumes the network for the shared database and degrades cleanly when it drops — an offline banner, retry, and no partial saves. Offline demos run against the local Supabase stack. No sync layer, no conflict model.
- **AI scope:** structured fields only. The assistant reads DB columns (counts, statuses, prices, dates) and never sends tender PDFs, scans, drawings or remarks to any model provider. The same server route can widen later behind a written client approval.
- **Approval model:** two levels now. Group Head and Management are separate approver roles; quotes, OEM selection and orders each require a Group Head approval followed by a Management approval before the record advances. An `approvals` table stores stage, actor, level, decision, timestamp and note, so the gate order is data rather than hard-coded.
- **Data region:** Mumbai (`ap-south-1`), keeping defence data in India.

## Deferred / out of scope

- **Reminder email provider** — Phase 2 only; default to Resend when that work starts. Not an MVP decision.

## Boundaries

- In scope for this document: platform choices, the auth/RLS boundary, the AI boundary, the data region, and the hard business rules.
- Out of scope for this document: feature build order, UI wireframes, and the PRD's client-owned questions (the global-per-OEM capacity model and whether Finance checks order verification). Those belong in `IMPLEMENTATION-PLAN.md`.

## Failure modes to design for

- **Network drop mid-save** — no partial writes; Server Actions validate fully then commit atomically; the UI shows an offline banner and a retry, never a half-saved record.
- **Missing or wrong Supabase env vars** — fail loudly, naming the missing variable, never a blank screen.
- **RLS misconfiguration** — RLS on by default for every table; each role gets a deny test, not just an allow test.
- **Service-role key exposure** — the key exists only in server env; a check greps the client bundle and fails if it appears.
- **Migration drift** — a check that the committed migrations reproduce the database (empty `supabase db diff`).
- **AI provider down or rate-limited** — deterministic structured queries still answer; the assistant route returns an explicit "unavailable" state.
- **Document leak** — Storage buckets stay private; documents are reached only through short-lived signed URLs scoped to the requesting user.

## Validation

- **Vitest** — rule modules and Zod schemas: quantity coverage, commission gating on the OEM-payment milestone, two-level approval order.
- **SQL tests** — RLS allow/deny per role, and that a stage cannot advance without both approvals recorded in order.
- **Playwright** — sign-in, create an RFI, quote it through both approvals, then create a PO from the approved quotation only.
- **Manual** — all seven modules at phone width on a real device (R4).
- **AGENTS.md evidence** — each slice's command and its real output in `WORKLOG.md`; every claim in `REPORT.md` backed by a command.
