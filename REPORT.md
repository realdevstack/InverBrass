# REPORT — Inverbras Defence CRM

## Status per part

- Step 0 (handover docs): DONE
  - evidence: `TECH-STACK.md` and `IMPLEMENTATION-PLAN.md` in the project root; superseded `tech-stack.md` moved to `docs/superseded/`.
- Step 1 (foundation and guardrails): DONE with one BLOCKED item
  - evidence: `npm run build` -> `✓ Compiled successfully in 28.1s`; `curl http://localhost:3000/health` -> `HTTP 200`, shows version `0.1.0`, names missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`, reports Supabase `401 Unauthorized` as `reachable, but the publishable key is missing or invalid`.
  - BLOCKED: local Supabase stack (`supabase start`) — no Docker/Podman on this machine. Worked around by pointing the Supabase CLI at the hosted project, so migrations and SQL tests run against real Postgres instead of a local container.

- Step 2 (data model, enums, constraints): DONE
  - evidence: 9 migrations applied (`Applying migration ...` ×9, `Finished supabase db push.`); `npm run db:list` shows Local == Remote for every version; `npm test` -> `Tests 9 passed (9)` covering the coverage maths, the global-per-OEM capacity view, and the PO / PDI / commission / quotation-approval gates; `npm run db:seed` -> `Seed applied. oems now: 3`; `node scripts/verify.mjs` -> R1 coverage 1500 required / 1000 firm / 500 uncovered.
- Step 3 (auth, roles, RLS, audit, approvals): DONE for the database; app-side sign-in built, not yet end-to-end verified (needs the publishable key)
  - evidence: 5 migrations applied; `npm test` -> `Tests 18 passed (18)` including RLS allow/deny per role, the audit actor/changed-fields check, and the two-level order (Management refused before Group Head; status `draft` after one approval; `approved` after both); `npm run build` -> `✓ Compiled successfully`.
  - defect found and fixed: rule functions ran as the caller, so RLS hid the rows they check; they are now `SECURITY DEFINER` (`20260926091400`).

- Step 4 (RFI and line items): DONE
  - evidence: `npm test` -> `Tests 27 passed (27)` (bulk parser: tab/comma/spaces, per-line rejections with reasons, 500-line ceiling, IST date boundaries); `node scripts/verify-page.mjs` -> `/requirements -> HTTP 200 contains "Airborne Radio Set": true`, detail page contains "Quantity coverage"; storage round trip in `scripts/verify-api.mjs` -> `upload ok: true`, `signed url fetch: HTTP 200`, `cleanup removed: true`.
- Auth through the publishable key: DONE
  - evidence: `GET /auth/v1/health` with apikey -> `200 GoTrue v2.197.0`; password sign-in for a seeded demo user -> token present; `node scripts/verify-api.mjs` -> sales sees 2 requirements and 0 commission invoices, finance sees 1.

- Step 5 (OEM master): DONE
  - evidence: `node scripts/verify-page.mjs` -> `/oems -> HTTP 200 contains "OEM master": true`, `/oems/1111…1` shows Bharat Dynamics, `/oems/expiring -> HTTP 200 contains "Certification expiry": true`; SQL test `Step 5 — OEM certification expiry view` classifies expired / due soon / valid.
- Step 6 (sourcing and quantity coverage): DONE
  - evidence: `verify-page.mjs` -> `/sourcing -> HTTP 200 contains "Per-requirement coverage": true`, detail page shows line coverage; the firm-vs-availability coverage maths remains covered by the Step 2 SQL tests.
- Step 7 (historical ingestion): DONE
  - evidence: dry run `rows read 6, imported 3, rejected 3`, `Reconciliation: balanced`, with a reason per rejected row; reviewed `--commit` imported 3 and a re-run skipped 3 (idempotent); `node scripts/verify-steps.mjs` shows the imported Radar Module / Comms Unit past bids. No `.xlsx` parser ships in the app; the workbook is exported to CSV offline.
- Step 8 (quotation and bid intelligence): DONE
  - evidence: `verify-page.mjs` -> `/quotations` and `/quotations/…ddd1` render with the past-bid search; `npm test` quotation rules pass (recommendation never sets the final price; commission breakdown); the approval gate (no `approved`/`won` without both levels) is unchanged and green.
- Step 9 (post-submission and PO): DONE
  - evidence: `verify-page.mjs` -> `/orders` and `/orders/…fff1` render the verification checklist and Group Head sign-off; the no-orphan-PO DB constraint remains green.
- Step 10 (material readiness, PDI, LD risk): DONE
  - evidence: `npm test` ld-risk suite (6 tests) passes including the IST day boundary; `verify-page.mjs` -> `/delivery` and `/delivery/…fff1` render; SQL test proves `days_to_deadline` and the stored extension request.
- Step 11 (invoicing, delivery, payments, commission): DONE
  - evidence: `verify-page.mjs` -> `/finance` and `/finance/…881` render; SQL test proves a part payment reduces the balance (paid 400, balance 600); invoice-after-PDI and commission-after-payment remain DB-enforced.
- Step 12 (document vault): DONE
  - evidence: `verify-page.mjs` -> `/documents` renders the register with PO links and the expiring filter; migration `20260926092300` adds `storage_path` to the register view for signed URLs.
- Step 13 (dashboard, reports, deterministic queries): DONE
  - evidence: `verify-page.mjs` -> `/` and `/reports` render; `npm test` answers suite passes; `node scripts/verify-steps.mjs` returns real metrics (`total_rfis 4, open_pos 1, pending_oem_invoices 1, documents_expiring 1`).
- Step 14 (optional AI assistant): DONE with one UNVERIFIED item
  - evidence: `/assistant` renders "off by default"; `POST /api/assistant` with no key -> `HTTP 200 source=deterministic answer="There are 1 open purchase order(s)."`.
  - UNVERIFIED: live provider rephrasing (no `AI_ASSISTANT_API_KEY` is configured here). The fall-back path is what runs by default.

- Design system refresh (member-supplied, 26 Sep): DONE
  - evidence: `npm run build` -> `✓ Compiled successfully`; the Ink Navy rail, signal/amber/green/red status colours and the three typefaces are in `globals.css`, `layout.tsx` and `app-shell.tsx`; status is a rail + dot + word, never colour alone.
- Distinct role menus + owner user administration: DONE
  - evidence: `node scripts/verify-roles.mjs` -> `sales` sees Dashboard/RFIs/OEMs/Sourcing/Quotations/Documents/Assistant; `operations` sees Dashboard/RFIs/OEMs/Orders/PDI/Documents/Assistant; `finance` sees Dashboard/RFIs/OEMs/Orders/Finance/Documents/Reports/Assistant; privileged roles see everything plus Schema; only `owner` sees `Users & roles`. `/admin/users` returns full access for the Owner and the owner-only message for everyone else.
  - evidence: `npm test` -> `role/area parity between the app and the database` and `user administration (owner only)` pass.
- Reports grouped + master data seeded and linked + process flow (member request, 26 Sep): DONE
  - evidence: `node scripts/verify-page.mjs` -> `/reports` contains `Sales Reports`, `Operational Reports`, `Financial Reports`; `/process` contains `Order management stages`; `node scripts/verify-steps.mjs` -> `customers 3, products 4, requirements_linked_customer 4, lines_linked_product 4, pos_linked_customer 1`; `node scripts/verify-roles.mjs` -> `ALL ROLE MENUS AND PAGES OK` (Process flow in every role's menu).
  - Customer Master and Part Master are now seeded demo data and linked to `requirements.customer_id`, `line_items.product_id` and `purchase_orders.customer_id`; new records link by name/part number automatically.
- Recovered requirements from the client workbook (26 Sep): DONE for the deterministic parts
  - evidence: migrations `20260926092500`-`20260926092900` applied; auto numbering -> `node scripts/verify-steps.mjs` -> `RFI/2026/0001…0004`, `QTN/2026/0001…0004`; dashboard tiles + 8 Critical KPIs -> same script -> `commission_receivable 796500.00`, KPI views populated; `npm test` -> `recovered-requirements` and `critical KPIs` suites pass.
  - evidence: `node scripts/verify-page.mjs` -> `ALL PAGES OK` incl. `/customers`, `/products`, `/admin/audit`, `/quotations/…/print`, and `/api/export` returning `text/csv` (header `client,po_count,total_value`).
  - DEFERRED (recorded, not dropped): outbound email / payment-due / escalation email (TECH-STACK defers all outbound messaging to Phase 2), GeM portal integration (no portal API; CSV import is the path), WhatsApp (optional), server-side `.xlsx` writer (CSV is Excel-compatible). Competitor master stays free text until its columns are provided.
- Business flow logic (27 Sep): DONE
  - evidence: migration `20260926093200_business_flow_rules.sql` applied (`Applying migration 20260926093200_business_flow_rules.sql...`, `Finished supabase db push.`); `npx vitest run tests/sql/business-flow.test.ts` -> `Test Files 1 passed (1)`, `Tests 10 passed (10)`; `npm test` -> `Test Files 14 passed (14)`, `Tests 72 passed (72)`; `npm run build` -> `✓ Compiled successfully`; `node scripts/verify-page.mjs` -> `ALL PAGES OK`.
  - Two real gaps closed: (1) the PO gate accepted `submitted` / `awaiting_approval` — it now requires both approval levels on record (`has_two_level_approval`), so a PO can only come from a genuinely approved quotation, whatever stage the status has since moved to; (2) a delivery or payment could exceed the invoiced quantity / gross amount — cumulative caps now refuse an over-run. Both are DB triggers, so no UI or direct call can bypass them.
  - App-side guards added in `finance/actions.ts` (`recordPaymentAction`, `recordDeliveryAction`) so the over-run is rejected with a clear reason before the insert, matching the database.
  - Rule visibility: `/process` now lists each of the seven rules and how it is enforced.
  - Latent defect found and fixed while regenerating types: the live column was `inverbrass_vendor_registration` but the app used `Inverbras_vendor_registration` (wrong case and spelling), so the customer create/detail path could never read or write that field. Migration `20260926093300_customer_vendor_registration_column.sql` renames it to `inverbras_vendor_registration`; app, validation, form and seed updated; `npm run db:seed` -> `Seed applied. oems now: 3`; signed-in `/customers/33333333-…331` shows `IB-VEND-0007`.
- Automation requirements validation (27 Sep): DONE for 6 of 10, PARTIAL for 2, MISSING for 2 (the PRD/tech-stack deferred outbound messaging to Phase 2)
  - evidence: live `pg_trigger`/`pg_proc` query -> `TABLES WITHOUT AN AUDIT TRIGGER: ["audit_log","quotation_versions"]`; auto-number triggers on `requirements`, `quotations`, `material_readiness`, `pdis`, `deliveries`; `v_dashboard_metrics` returns live numbers `total_rfis 4, open_pos 1, overdue_invoices 0, documents_expiring 1, commission_receivable 796500.00`.
  - DONE: automatic RFI numbering (`RFI/YYYY/NNNN`), automatic quotation numbering (`QTN/YYYY/NNNN`), approval workflow for quotations and orders (two-level, DB-enforced), auto commission calculation, auto dashboard updates (live views on every request), audit logs for every business table.
  - PARTIAL (in-app only, no message is sent): payment-due visibility (`v_followup_tracker.overdue_days`), document/certification expiry reminders (`/documents?expiring=1`, `/oems/expiring`, dashboard tile).
  - MISSING: email reminders; escalation workflow for overdue payments (the `followup_status` field is a manual dropdown; there is no scheduler, queue or mail provider in the repo).
  - Follow-up (27 Sep): the reminder email **formats** now exist as placeholders — `/notifications` shows the five templates (RFI deadline, payment due, overdue escalation, document expiry, OEM certification expiry) with their merge fields, a filled sample, and drafts built from live records, each with an "Open in mail client" `mailto:` link. Nothing is sent; automated sending is still deferred to Phase 2. Evidence: `npm test` -> `Tests 78 passed (78)`; `npm run build` -> `✓ Compiled successfully` incl. `ƒ /notifications`; live fetch -> `/notifications HTTP 200` contains "Reminder emails", "Template catalogue", "Open in mail client"; every role's menu shows it (`grouphead / management / sales / operations / finance` -> menu has Reminders=true, `/notifications` HTTP 200).
  - Follow-up 2 (27 Sep): **one-click contact placeholders** now sit where a follow-up happens — the dashboard shows Email / WhatsApp / Call icons on overdue payments, a new "Pending OEM invoices" list, and expiring documents (to chase the OEM); the finance invoice table has a Contact column for Customer and OEM. Icons are `mailto:` / `wa.me` / `tel:` links resolved from the master contacts; a greyed icon means no contact on file; nothing is sent. Evidence: `npm test` -> `Tests 83 passed (83)`; `npm run build` -> `✓ Compiled successfully`; live fetch -> `/ has mailto/wa.me/tel + legend: true`, `/finance has mailto/wa.me/tel: true`; `node scripts/verify-page.mjs` -> `ALL PAGES OK`.
  - Follow-up 3 (27 Sep): `/review uncommitted` found 3 issues; all fixed. Customer contact now resolves by id (`po.customer_id` added to `v_invoice_balances` and `v_followup_tracker`, migration `20260926093400`, with the name lookup kept only as a fallback), the stored email is sanitised before the `mailto:` (no `? & #` CR/LF injection), and the contact lookup reads only the rows on screen instead of the whole master data. Evidence: `npm test` -> `Tests 84 passed (84)`; live fetch -> `/finance customer resolved by id (HAL contact): true` (`a.sharma@example.invalid`), `/ has no injected email: true`; `node scripts/verify-page.mjs` -> `ALL PAGES OK`.

## Running the demo

- `npm run dev`, then open http://localhost:3000.
- Sign in with `owner@Inverbras.demo` / `Inverbras#2026` (also `grouphead@`, `management@`, `sales@`, `operations@`, `finance@` at the same domain/password).
- `/requirements` lists the seeded "Airborne Radio Set" with coverage; open it for line items, coverage and documents.
- Region: per the client, the Singapore project is accepted for the demo MVP. Recorded as a deviation from the Mumbai lock in `TECH-STACK.md`.

## Workbook coverage — "Input Sheet" and "Master Data Inputs"

Checked field by field against the live schema (`information_schema.columns`, 26 Sep). "Master Data Inputs" is complete: every Customer, OEM and Product-master field is a column and has a screen. "Input Sheet" coverage by stage:

| Stage | Covered | Remaining / deferred |
|---|---|---|
| RFI / Tender Enquiry | all fields incl. associated OEM, second (client) part number, quotation validity, staggered delivery, assigned employee, remarks, approvals, regret letter | deadline reminder is in-app (dashboard); outbound email deferred |
| Quotation | all fields incl. OEM quotation number, date, unit price, quantity, currency, discount, validity, PNC, compliance, attachment slot, notes | currency *conversion* deferred; quotation email deferred; PDF via print |
| Purchase Order | all fields incl. PDI inspector, special conditions, partial delivery, documentation, amendment note | automatic status derivation not automated; amendment captured as a field |
| Material Readiness | all fields incl. quantity ready, batch/serial, QC, tentative PDI date, auto `MR/YYYY/NNNN` | readiness alerts deferred |
| PDI / Inspection | all fields incl. linked item, inspector, test-certificate slot, offered/cleared/rejected, re-PDI, dispatch clearance, auto `PDI/YYYY/NNNN` | inspection calendar, mandatory document checklist and auto-alerts deferred |
| OEM Invoice | all fields incl. courier details, e-way bill, documents submitted, multiple-invoice, auto invoice-after-PDI | document-checklist verification deferred |
| Delivery | all fields incl. GRN, POD slot, closure status, remarks, auto `DLV/YYYY/NNNN` | auto-close on full delivery not automated |
| Payment Tracking | all fields incl. proof slot, overdue days, follow-up status, remarks, aging | automated overdue email deferred (in-app overdue list built) |
| Commission Invoice | all fields incl. auto amount, GST/TDS, dates, gross value, outstanding, remarks | reminder automation deferred; profitability report built |

Master Data Inputs: Customer Master (14 fields + multiple contacts), OEM Master (16 fields + contacts + certification expiry), Product/Part Master (14 fields incl. HSN, compliance certifications, shelf life, export restriction, standard price, currency) — all present. Competitor Data has no fields in the sheet, so nothing was built.

## Deployment

### GitHub — DONE
- Pushed `main` to https://github.com/realdevstack/InverBrass.git.
- evidence: `git push -u origin main` -> `* [new branch] main -> main`; later pushes `081b555..42f2465  main -> main`; `git ls-remote --heads origin` -> `42f246556b888df68aab66f0d53ad3179abc6356 refs/heads/main`.
- `.env.local` is not committed (gitignored); only `.env.example` is tracked. Verified with `git ls-files | grep .env`.

### Vercel — live via the GitHub integration (27 Sep)
- The contact-placeholder commit `42f2465` was pushed to `main`, and the Vercel project is connected to the GitHub repo, so the push triggered a production deployment.
- evidence (live fetch, signed in as the seeded owner): `https://inverbrass.vercel.app/` -> `wa.me:true mailto:true oemEmail:true`; `/finance` -> `wa.me:true customerEmail:true oemEmail:true`; `/notifications` -> `Template catalogue:true`.
- The Vercel CLI cannot deploy from this machine (no `~/.vercel/auth.json`, no `VERCEL_TOKEN`; `npx vercel whoami` hangs on interactive login). Deployment therefore relies on the GitHub integration, which works.

### Vercel 500 on protected pages — ROOT CAUSE FOUND (env vars missing)
Fetched the live deployment: `/` and `/requirements` returned **500**, while `/health` and `/login` returned 200. The live `/health` page names the cause:
`Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY` — both **no**; `SUPABASE_SERVICE_ROLE_KEY` **yes**.
Fix: add those two variables to Vercel (Production + Preview) and **redeploy** (NEXT_PUBLIC values are baked at build time); `/health` should then show both as `yes`. A root `error.tsx` now turns this class of failure into a friendly message that links to `/health`.

### Vercel — project deploy BLOCKED from this machine (needs the member's login)
```
BLOCKED: create the Vercel project and deploy
  Tried:      npx --yes vercel@latest whoami
  Got:        Error: Worker timed out after 10 seconds (no stored credentials: %USERPROFILE%\.vercel\auth.json absent; VERCEL_TOKEN unset)
  Wall:       Vercel auth is an interactive device/browser login that cannot be completed from here, and no token was provided.
  To unblock: import the repo in the Vercel dashboard (below) or run `vercel login` + `vercel --prod` on a machine the member controls.
```
Import settings: Framework preset **Next.js**, root directory **repo root**, build `next build`, install `npm install`.
Environment variables (copy values from `.env.local`; never commit them):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for `/admin/users`)
- optional `AI_ASSISTANT_API_KEY`, `AI_ASSISTANT_BASE_URL`, `AI_ASSISTANT_MODEL`
- **not** needed on Vercel: `SUPABASE_DB_URL` (that is only for running migrations from a machine).
After the first deploy, add the Vercel URL to Supabase → Authentication → URL Configuration so future emailed links point at the live site.

Vercel flags `NEXT_PUBLIC_*` variables ("remove the public prefix to keep this value private"). For these two it is a false alarm, and the prefix is required: Next.js only exposes `NEXT_PUBLIC_*` to the browser, and the Supabase browser client needs both names.
- evidence: key classification -> `NEXT_PUBLIC_SUPABASE_ANON_KEY = publishable key (browser-safe by design)`, `SUPABASE_SERVICE_ROLE_KEY = secret key (server-only)`; `public tables: 24, tables WITHOUT row level security: 0`.
- Action: keep both `NEXT_PUBLIC_` names and set them as **Config / plain** (not Sensitive). Mark only `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive**.

## Validation limits

- **Playwright is not installed or run.** TECH-STACK.md permits dropping it if it becomes a burden. The sign-in and page-render path is instead proven by `scripts/verify-page.mjs` (real Supabase password sign-in, real HTTP fetches, `ALL PAGES OK`), and the approval / PO / PDI / commission gates are proven by the SQL tests.
- **AI provider rephrasing is UNVERIFIED** — no `AI_ASSISTANT_API_KEY` is configured, which is the intended default. The deterministic path that runs with no key is verified.
- **Deferred from the workbook, with reasons:** outbound email reminders, payment-due reminders and email escalation (TECH-STACK defers all outbound messaging to Phase 2 — the app shows the reminders in-app instead); GeM portal integration (the portal exposes no API; CSV/Excel import is the path); WhatsApp notifications (marked optional); a server-side `.xlsx` writer (exports are CSV, which Excel opens). The Competitor master is a free-text field until the client supplies its columns. These are not built and not claimed as built.

## Blockers

```
BLOCKED: local Supabase stack (supabase start / supabase db reset)
  Tried:      npx supabase start
  Got:        failed to inspect container health: docker: command not found (podman also not found) — install Docker Desktop or Podman and ensure it is on PATH
  Wall:       No Docker Desktop, Podman or WSL on this Windows machine; supabase start runs the stack in containers.
  To unblock: a machine with Docker Desktop (or install it and restart the terminal).
  Impact:     `supabase db reset` and `supabase db diff` cannot run locally. Migrations are instead applied and verified against the hosted project with `npm run db:push`.
```

```
BLOCKED: Supabase API keys (NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  Tried:      health page + Supabase auth health check against the hosted project
  Got:        GET .../auth/v1/health -> 401 Unauthorized (no publishable key configured)
  Wall:       The anon and service-role keys are issued in the Supabase dashboard; they are not derivable from the database URL.
  To unblock: paste the project's anon/publishable key and service-role key (Settings -> API), or set them in .env.local.
  Impact:     Auth, RLS-through-the-API, and the signed-in UI cannot be verified until set. Database work continues without them.
```

```
BLOCKED: supabase db diff (migration-drift check)
  Tried:      npm run db:diff  (supabase db diff --schema public)
  Got:        docker: command not found (podman also not found) — a shadow database is created in Docker
  Wall:       Same missing container runtime as `supabase start`; the diff runs the schema in a throwaway database.
  To unblock: a machine with Docker Desktop. Migrations are still proven applied: `npm run db:list` shows Local == Remote for every version.
```

## Contradictions found between sources (resolved in favour of TECH-STACK.md)

- **Region.** TECH-STACK.md locks Mumbai (`ap-south-1`). The project actually supplied answers on the Singapore pooler (`aws-0-ap-southeast-1.pooler.supabase.com`). UNVERIFIED region of record (needs the dashboard to confirm), but the reachable pooler is Singapore — this appears to conflict with the India-residency requirement (R1) and is flagged for the client.
- **Approval levels.** PRD §2 (assumption #9) and the superseded `tech-stack.md` say single-level. TECH-STACK.md "Decisions locked" says two levels, and the plan calls a single flag a defect. Building two levels.
- **Role count.** PRD §3 lists four rows; the superseded stack says four; TECH-STACK.md says five; the plan enumerates six. Building six (`owner`, `group_head`, `management`, `sales`, `operations`, `finance`) and recording the choice here.
- **Design tokens.** IMPLEMENTATION-PLAN.md "Design tokens" fixes a Cream/Ink Blue/Deep Teal/Warm Sand palette and a light canvas. The member supplied a new design system on 26 Sep (Ink Navy rail, Signal Teal / Alert Amber / Clear Green / Risk Red, Space Grotesk + IBM Plex Sans + IBM Plex Mono, dark left rail). The member's design wins; `globals.css`, `layout.tsx` and `app-shell.tsx` implement it. It also supplies the Risk Red the plan asked for before Step 10.
- **Fuller brief after the PRD.** The member supplied the client workbook on 26 Sep and said the PRD/design had missed requirements. The workbook's five tabs are now part of the brief and are recorded in IMPLEMENTATION-PLAN.md "Recovered requirements — client workbook, 26 Sep 2026". The documents, not the earlier chat, were updated in the same change.
- **Company name in the workbook.** The Input Sheet names the company "Supreme Q" in the commission and employee columns, while the PRD, TECH-STACK and plan say "Inverbras". The UI keeps "Inverbras"; flagged for the member to confirm.

## Claims ledger

| Claim | Command | Result |
|---|---|---|
| App builds | `npm run build` | `✓ Compiled successfully` |
| Health page serves | `curl http://localhost:3000/health` | `HTTP 200` |
| Health names a missing var | health page HTML | contains `NEXT_PUBLIC_SUPABASE_ANON_KEY` and "Missing environment variable" |
| Hosted DB reachable | `supabase migration list --db-url ...` | `Local \| Remote \| Time (UTC)` header, no error |
| Local Supabase stack | `npx supabase start` | BLOCKED — docker not found |
| Migrations 20260926091800-92300 applied | `npm run db:push` | `Applying migration …`, `Finished supabase db push.` |
| Local == Remote for new migrations | `npm run db:list` | six rows `20260926091800`-`92300`, Local == Remote |
| Migration drift | `npm run db:diff` | BLOCKED — docker not found (shadow database) |
| Steps 5-14 pages render signed-in | `node scripts/verify-page.mjs` | `ALL PAGES OK` (OEMs, sourcing, quotations, orders, delivery, finance, documents, reports, assistant) |
| Assistant answers with no key | `POST /api/assistant` | `HTTP 200 source=deterministic answer="There are 1 open purchase order(s)."` |
| Assistant provider rephrasing | — | UNVERIFIED — no `AI_ASSISTANT_API_KEY` configured |
| Historical import reconciliation | `npm run import:history -- scripts/sample-history.csv` | `rows read 6, imported 3, rejected 3`, `balanced` |
| Historical import idempotent | re-run `--commit` | `imported 0, skipped 3` |
| Part payment reduces balance | SQL test `steps5-13` | paid 400, balance 600 |
| LD risk days-to-deadline | SQL test `steps5-13` | `days_to_deadline 5` |
| Full suite | `npm test` | `Test Files 10 passed (10)`, `Tests 49 passed (49)` |
| Lint | `npm run lint` | clean |
| Typecheck | `npm run typecheck` | clean |
| Production build | `npm run build` | `✓ Compiled successfully`, 40 routes (incl. `/process`) |
| Vibrant theme builds | `npm run build` | `✓ Compiled successfully` after the light/vibrant redesign |
| GitHub push | `git push -u origin main` | `* [new branch] main -> main`; remote head `341d0d8` |
| No secret committed | `git ls-files \| grep .env` | only `.env.example`; no `.env.local` |
| Service key is server-only | grep `supabase/admin` | imported only by `admin/actions.ts` and `admin/users/page.tsx` (both server) |
| Vercel deploy | `npx vercel whoami` | BLOCKED — interactive login; deploy done from the dashboard by the member |
| Live 500 root cause | `curl https://inverbrass.vercel.app/health` | page reports `NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY` missing |
| Brand rename | `Select-String src -Pattern Inverbrass` | 0 capital occurrences (only `@inverbrass.demo` demo logins kept) |
| Logo assets served | `curl -o NUL -w %{http_code}` | `/Inverbras-logo.jpg=200`, `/logo-mark.png=200`; `/login` renders the real JPG via `/_next/image` |
| Reports grouped Sales/Operational/Financial | `node scripts/verify-page.mjs` | `/reports` contains all three group headings |
| Master data seeded and linked | `node scripts/verify-steps.mjs` | `customers 3, products 4, requirements_linked_customer 4, lines_linked_product 4, pos_linked_customer 1` |
| Sheet1 stage flow page | `node scripts/verify-page.mjs` | `/process` → "Order management stages", live counts, gates |
| Auto RFI/quotation numbering | `node scripts/verify-steps.mjs` | `RFI/2026/0001…0004`, `QTN/2026/0001…0004` |
| Dashboard tiles + Critical KPIs | `node scripts/verify-steps.mjs` | `commission_receivable 796500.00`; KPI views populated |
| Recovered schema/views | `npm test` | `recovered-requirements` suite passes (numbering, master RLS, client part no., 17 KPI/report views) |
| CSV export (Excel-compatible) | `node scripts/verify-page.mjs` | `/api/export` HTTP 200, `text/csv`, header `client,po_count,total_value` |
| Print-to-PDF quotation | `node scripts/verify-page.mjs` | `/quotations/…/print` HTTP 200 |
| Outbound email / GeM / WhatsApp / .xlsx | — | DEFERRED (see below), not attempted |
| Role menus differ by role | `node scripts/verify-roles.mjs` | distinct nav per role; only Owner sees `Users & roles` |
| Admin page is owner-only | `node scripts/verify-roles.mjs` | owner: full access; all other roles: owner-only message |
| App/DB permission parity | `npm test` | `role/area parity between the app and the database` passes |
| Owner-only user administration | `npm test` | `user administration (owner only)` passes |
| Business flow migration applied | `npm run db:push` | `Applying migration 20260926093200…`, `Finished supabase db push.` |
| Quotation-from-RFI and PO-from-approved gates | `npx vitest run tests/sql/business-flow.test.ts` | 10 tests pass |
| Multiple invoices per PO / deliveries per invoice | `npx vitest run tests/sql/business-flow.test.ts` | two invoices persist; two partial deliveries persist and a third is refused |
| Commission after OEM payment milestone | `npx vitest run tests/sql/business-flow.test.ts` | refused on a part payment, allowed once paid |
| Partial payments and over-payment guard | `npx vitest run tests/sql/business-flow.test.ts` | paid 400+600 -> balance 0; a further payment refused |
| Audit trail on the whole chain | `npx vitest run tests/sql/business-flow.test.ts` | an insert audit row per stage; update row names `status` |
| Full suite after the change | `npm test` | `Test Files 14 passed (14)`, `Tests 72 passed (72)` |
| Build after the change | `npm run build` | `✓ Compiled successfully` (40 routes) |
| Pages after the change | `node scripts/verify-page.mjs` | `ALL PAGES OK` |
| Business flow rules visible | signed-in fetch of `/process` | HTTP 200 contains "Business flow rules" |
| Vendor-registration column aligned to the app | `npm run db:push` + `npm run db:seed` | rename applied; `Seed applied. oems now: 3`; `/customers/33333333-…331` shows `IB-VEND-0007` |
| Reminder email templates exist (placeholder only) | `npm test` | `Tests 78 passed (78)` (6 new template tests) |
| `/notifications` page renders with templates | live fetch on a started prod server | HTTP 200 contains "Reminder emails", "Template catalogue", "Open in mail client" |
| Every role can see the reminders page | live fetch per role | `grouphead / management / sales / operations / finance: menu has Reminders=true, /notifications HTTP 200` |
| Automated email sending | — | NOT BUILT (deferred to Phase 2); templates are placeholders with a `mailto:` link only |
| Contact icons on dashboard + finance | live fetch on a started prod server | `/ has mailto/wa.me/tel: true`, `/finance has mailto/wa.me/tel: true`; dashboard sample `wa.me/919000000001` |
| Contact helpers | `npm test` | `Tests 83 passed (83)` (4 new tests; one caught and fixed a primary-contact ordering bug) |
| Pages after contact icons | `node scripts/verify-page.mjs` | `ALL PAGES OK` (incl. `/ has wa.me`, `/finance has wa.me`) |
| Sending on any channel | — | NOT BUILT: icons open the user's own mail/WhatsApp/phone app with the message prefilled |
| Review fixes applied (customer_id, email sanitising, bounded reads) | live fetch + `npm test` | `/finance customer resolved by id (HAL contact): true`; `/ has no injected email: true`; `Tests 84 passed (84)` |
