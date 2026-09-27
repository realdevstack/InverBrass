# WORKLOG — Inverbras Defence CRM

One line per slice: `<what I did> -> <the command I ran> -> <what it actually printed>`.

## Step 0 — Handover docs

- Copied the plan into the project root -> `Copy-Item ...1790431715339-Inverbras-implementation-plan.md IMPLEMENTATION-PLAN.md` -> file created (17,747 bytes).
- Copied the authoritative tech stack to `TECH-STACK.md`; moved the superseded `tech-stack.md` to `docs/superseded/` so no agent reads the single-approval spec -> `Copy-Item`, `Move-Item` -> `TECH-STACK.md` present; `docs/superseded/tech-stack.md` present.

## Step 1 — Foundation and guardrails

- Checked the toolchain -> `node --version; npm --version; git --version` -> `v24.19.0`, `11.19.0`, `git version 2.53.0.windows.2`.
- Checked for a container runtime (Supabase local needs one) -> `supabase --version; docker --version` -> `supabase` and `docker` not recognised on PATH. `supabase start` -> `failed to inspect container health: docker: command not found (podman also not found) — install Docker Desktop or Podman and ensure it is on PATH`. BLOCKED: local Supabase stack.
- Scaffolded Next.js App Router + TypeScript strict -> `npx create-next-app@latest scaffold-tmp --ts --tailwind --eslint --app --src-dir --use-npm --empty --disable-git --yes` -> `Success! Created scaffold-tmp`; Next 16.3.6, React 19.2.8, Tailwind 4.
- Installed data/auth/validation deps -> `npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers clsx tailwind-merge class-variance-authority lucide-react` -> `added 21 packages ... 0 vulnerabilities`.
- Installed dev deps -> `npm install -D "@types/node@^24" vitest tsx supabase dotenv` -> Supabase CLI `2.118.0`, Vitest `5.0.2`.
- Initialised the migrations harness -> `npx supabase init` -> `Finished supabase init.` (`supabase/config.toml`).
- Confirmed the hosted database is reachable through the pooler -> `supabase migration list --db-url <pooler>` -> header `Local | Remote | Time (UTC)` with no error (empty remote, fresh project).
- Generated the initial database types -> `npm run gen:types` -> `Wrote D:\FWAI\projects\InverBase\src\lib\database.types.ts`.
- Built the app -> `npm run build` -> `✓ Compiled successfully in 28.1s`, routes `/`, `/_not-found`, `ƒ /health`.
- Ran the app and fetched the health page -> `npm run dev` then `curl.exe -s -o health.html -w "HTTP %{http_code}" http://localhost:3000/health` -> `HTTP 200`; page contains app version `0.1.0`, names the missing variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and reports `GET https://apehdunpzntflpsfeylj.supabase.co/auth/v1/health -> 401 Unauthorized` as `reachable, but the publishable key is missing or invalid`.

## Step 2 — Data model, enums and constraints

- Wrote 9 migrations (helpers, enums, core, sourcing, quotations, orders, support, fulfilment, views + hard rules) -> `npm run db:push` -> each printed `Applying migration ...` and `Finished supabase db push.`
- Confirmed local and remote histories match -> `npm run db:list` -> every version shows a `Local` and a `Remote` entry (e.g. `20260926090000 | 20260926090000 | 2026-09-26 09:00:00`).
- Regenerated types -> `npm run gen:types` -> `Wrote src/lib/database.types.ts` (now 20 tables + 3 views).
- SQL constraint/view tests -> `npm test` -> coverage example computes (1000 required, 600 + 400 firm, uncovered 0), flipping B to availability gives uncovered 400, OEM capacity 1000/700 -> 300 available, and the PO / invoice / commission / quotation-approval gates all reject then pass.
- Loaded demo data -> `npm run db:seed` -> `Seed applied. oems now: 3`.
- Verified the demo dataset and views -> `node scripts/verify.mjs` -> `COUNTS {"oems":3,...,"documents":2}`; `COVERAGE` R1 = required 1500, firm 1000, uncovered 500; `CAPACITY` Bharat Dynamics 1000 cap / 600 committed / 400 available.

## Step 3 — Auth, roles, RLS, audit and approvals

- Wrote 4 migrations (roles + helpers, RLS policies, audit triggers, record_approval) -> `npm run db:push` -> `Applying migration ...` for all four, `Finished supabase db push.`
- Found and fixed a real defect: the hard-rule trigger functions ran as the caller, so RLS hid the rows they check (a Finance invoice could not see the PDI). -> added `20260926091400_rule_functions_security_definer.sql`; `npm run db:push` -> `Applying migration ...security_definer.sql`.
- RLS allow and deny tests, audit test and two-level approval test -> `npm test` -> `Test Files 3 passed (3)`, `Tests 18 passed (18)`. Includes: sales reads requirements but reads 0 finance rows and is refused writing a commission invoice; finance refused writing requirements; operations refused writing quotations; audit row records the owner and `changed_fields` includes `project_name`; Management is refused before Group Head, status stays `draft` after one approval, and becomes `approved` after both.
- Created the six demo users -> `npm run db:seed-users` -> `created owner@Inverbras.demo as owner` ... `users: [{"role":"owner",...}]`.
- First attempt hand-inserted auth.users rows; sign-in failed -> `POST /auth/v1/token?grant_type=password` -> `500 unexpected_failure "Database error querying schema"`. Fixed by creating users through the Admin API with the secret key (GoTrue populates every auth column).
- Built the app -> `npm run build` -> `✓ Compiled successfully in 37.3s`; routes `/`, `/login`, `/health`, `/schema`.

## Auth + data path (publishable key)

- Auth health with the publishable key -> `GET /auth/v1/health` with `apikey` -> `HEALTH 200 {"version":"v2.197.0","name":"GoTrue",...}`.
- Password sign-in for the seeded owner -> `POST /auth/v1/token?grant_type=password` -> `SIGNIN OK user=owner@Inverbras.demo token_present=True`.
- RLS through the API -> `node scripts/verify-api.mjs` -> `owner v_requirement_coverage rows: 2`; `owner documents rows: 2`; `sales requirements rows: 2`; `sales commission_invoices rows: 0`; `finance commission_invoices rows: 1`; storage round trip `upload ok: true`, `signed url fetch: HTTP 200`, `cleanup removed: true`.
- Signed-in page rendering -> `node scripts/verify-page.mjs` -> `/requirements -> HTTP 200 contains "Airborne Radio Set": true`; `/requirements/… -> HTTP 200 contains "Quantity coverage": true`; `/ -> HTTP 200`; `/schema -> HTTP 200`; `/requirements without cookie -> HTTP 307 location=/login?next=%2Frequirements`.

## Step 4 — RFI and line items

- Bulk line-item parser + tests -> `npm test` -> `Test Files 5 passed (5)`, `Tests 27 passed (27)` (parser handles tab/comma/spaces, rejects bad part number / quantity / date with a reason, enforces the 500-line ceiling).
- Requirements list, create form (with bulk paste), detail page with per-line coverage, pursue decision and document upload -> `npm run build` -> `✓ Compiled successfully`; signed-in render verified above.
- Extended the coverage views to include display fields -> `npm run db:push` -> `Applying migration 20260926091500 / 20260926091700`; `20260926091600_storage_buckets.sql` created the private `documents` bucket and its RLS policies.
- IST day maths module for deadlines -> `npm test` -> date-boundary test passes (18:29Z is still the same IST day; 18:30Z rolls over).

## Design system refresh (member-supplied, 26 Sep)

- Adopted the Ink Navy rail / signal-teal-amber-green-red status palette and the Space Grotesk + IBM Plex Sans + IBM Plex Mono typefaces -> rewrote `src/app/globals.css` as Tailwind v4 `@theme` tokens + component classes, `src/app/layout.tsx` loads the three fonts with `next/font/google`, `src/components/app-shell.tsx` is now a dark left rail + light top bar with a client `NavLinks` for the active item -> `npm run build` -> `✓ Compiled successfully in 48s`.
- Status is shown as a left border + dot + word (`status-row[data-status]`), never colour alone. The palette adds a Risk Red, closing the "no danger colour" gap flagged in IMPLEMENTATION-PLAN.md.

## Step 5 — OEM master

- 6 read-model migrations (OEM directory + certification expiry, sourcing ledger + commitment detail, past-bid + approval state, delivery-risk columns/view, finance/document/dashboard views, document view storage) -> `npm run db:push` -> `Applying migration 20260926091800 … 20260926092300`, `Finished supabase db push.`; `npm run db:list` -> each shows `Local == Remote`.
- Types regenerated -> `npm run gen:types` -> `Wrote src/lib/database.types.ts`.
- OEM list, create form, detail (contacts + certifications) and the certification-expiry view -> `node scripts/verify-page.mjs` -> `/oems -> HTTP 200 contains "OEM master": true`; `/oems/1111…1 -> HTTP 200 contains "Bharat Dynamics": true`; `/oems/expiring -> HTTP 200 contains "Certification expiry": true`.
- Expiry classification (expired / due soon / valid) -> `npm test` -> `Test Files 10 passed`, SQL test `Step 5 — OEM certification expiry view` passes.

## Step 6 — Sourcing and quantity coverage

- Sourcing log + response + commitment actions and pages -> `node scripts/verify-page.mjs` -> `/sourcing -> HTTP 200 contains "Per-requirement coverage": true`; `/sourcing/…aaa1 -> HTTP 200 contains "Line coverage": true`.
- Firm-vs-availability effect on the uncovered balance was already proven in the Step 2 SQL tests; the new `v_commitment_detail` view adds the display fields.

## Step 7 — Historical Excel/CSV ingestion

- Pure mapping module + 4 tests -> `npx vitest run tests/rules/history-import.test.ts` -> `Tests 4 passed`.
- Dry run -> `npm run import:history -- scripts/sample-history.csv` -> `rows read 6, imported 3, skipped 0, rejected 3`, `Reconciliation: balanced`, with per-row reasons (`Missing part number`, `Quantity must be a positive number`, `Result must be one of`).
- Reviewed commit -> `npm run import:history -- scripts/sample-history.csv --commit` -> `imported 3`; re-run -> `imported 0, skipped 3` (idempotent).
- Past-bid queries then return real history -> `node scripts/verify-steps.mjs` -> `Radar Module / PN-RAD-01 / won` and `lost / price`, `Comms Unit / PN-COM-05 / submitted`.

## Step 8 — Quotation and bid intelligence

- Pricing rules (suggestion only, never auto-sets final price; commission breakdown) + tests -> `npm test` -> `quotation` suite passes.
- Quotation list with the three past-bid filters (part number, agency, product type), create-from-RFI form, detail with two-level approval buttons, version history and loss capture -> `node scripts/verify-page.mjs` -> `/quotations -> HTTP 200 contains "bid intelligence": true`; `/quotations/…ddd1 -> HTTP 200 contains "Past-bid intelligence": true`.
- A quotation still cannot reach `approved`/`won` without both approvals -> Step 2/3 SQL test remains green.

## Step 9 — Post-submission and Purchase Order

- PO list, create form that offers only approved quotations, detail with the Ops verification checklist and Group Head sign-off -> `node scripts/verify-page.mjs` -> `/orders -> HTTP 200 contains "Purchase orders": true`; `/orders/…fff1 -> HTTP 200 contains "Order verification": true`.
- No orphan PO rule unchanged and still tested at the database.

## Step 10 — Material readiness, PDI and LD risk

- Pure LD-risk engine (IST day maths) + 6 tests -> `npm test` -> `ld-risk` suite passes (buffer window, expected-late, on-track, late, IST boundary).
- Delivery list (at-risk first) and detail with material readiness + PDI forms and extension request -> `node scripts/verify-page.mjs` -> `/delivery -> HTTP 200 contains "LD risk": true`; `/delivery/…fff1 -> HTTP 200 contains "Material readiness": true`.
- Risk view exposes days-to-deadline and stores the extension request -> SQL test `Step 10 — delivery risk columns and view` passes (`days_to_deadline 5`, `extension_note "Production slipped"`).

## Step 11 — OEM invoicing, delivery, payments, commission

- Invoice form offers only POs with a cleared PDI; invoice detail supports partial payments, partial deliveries and the commission gate -> `node scripts/verify-page.mjs` -> `/finance -> HTTP 200 contains "OEM invoices": true`; `/finance/…881 -> HTTP 200 contains "Payments": true`.
- Partial payment reduces the balance -> SQL test `Step 11 — invoice balance from partial payments` -> paid 400, balance 600.
- Commission-after-payment and invoice-after-PDI gates remain enforced by the database triggers (Step 2 SQL tests).

## Step 12 — Document vault

- Register view now carries the storage location; upload form links each document to a PO, requirement or OEM; expiring filter -> `node scripts/verify-page.mjs` -> `/documents -> HTTP 200 contains "Document": true`; `v_document_register` includes `storage_path` (migration 20260926092300).

## Step 13 — Dashboard, reports, deterministic queries

- Deterministic answer layer + tests -> `npm test` -> `answers` suite passes (orders, won this month, lost, why-lost, invoices, expiry, revenue, fallback).
- Dashboard and reports -> `node scripts/verify-page.mjs` -> `/ -> HTTP 200 contains "Dashboard": true`; `/reports -> HTTP 200 contains "Revenue by client": true`.
- Metrics view returns real numbers -> `node scripts/verify-steps.mjs` -> `total_rfis 4, open_pos 1, pending_oem_invoices 1, documents_expiring 1`.

## Step 14 — Optional AI assistant

- Deterministic route with optional provider rephrasing; off by default -> `node scripts/verify-page.mjs` -> `/assistant -> HTTP 200 contains "off by default": true`; `POST /api/assistant` (no key) -> `HTTP 200 source=deterministic answer="There are 1 open purchase order(s)."`.
- With a key, the route rephrases and falls back on any provider error. UNVERIFIED for a live provider: no `AI_ASSISTANT_API_KEY` is configured in this environment.

## Role menus made distinct + owner user administration

- Found the menus looked identical because the read matrix was too broad (Sales and Operations had identical read sets; Finance read everything). Narrowed `role_can_read` per the PRD's role descriptions -> migration `20260926092400_narrow_role_read_matrix.sql`, `npm run db:push` -> `Applying migration 20260926092400_narrow_role_read_matrix.sql`, `Finished supabase db push.`
- Mirrored it in `src/lib/rules/access.ts` and gated cross-module links by role; `Reports` moved to the finance area.
- Per-role menu check -> `node scripts/verify-roles.mjs` (dev server running) -> `sales: Dashboard, RFIs, OEMs, Sourcing, Quotations, Documents, Assistant`; `operations: … Orders, PDI …`; `finance: … Orders, Finance, Documents, Reports …`; privileged all + Schema; `owner` also `Users & roles`.
- Parity test so the app menu can never offer what RLS denies -> `npm test` -> `role/area parity between the app and the database` passes.
- Owner-only user administration page -> `/admin/users` lists accounts, changes a role, activates/deactivates and deletes; adding a user returns a one-time temporary password. Service-role key stays server-side; every action re-checks the caller is Owner before touching the admin client -> `node scripts/verify-roles.mjs` -> `owner /admin/users -> HTTP 200: full access`; every other role -> `HTTP 200: owner-only message`.
- RLS evidence -> `npm test` -> `user administration (owner only)` passes (Owner can change a role; a non-owner's self-escalation changes nothing; deactivation cuts off reads).

## Recovered requirements from the client workbook (26 Sep)

- The member flagged that the PRD missed requirements. Listed every tab of the workbook -> gviz/htmlview extraction gave five tabs: Sheet1 (stage overview), Input Sheet (per-stage fields), Master Data Inputs, Dashboard requirements, Sheet7.
- Numbering, document types, master data, per-stage fields -> migrations `20260926092500`-`20260926092600`, `npm run db:push` -> applied; `npm run gen:types` -> `Wrote src/lib/database.types.ts`.
- Dashboard tiles, Critical KPIs and the missing reports -> migration `20260926092700` (views); coverage views extended in `20260926092800`; synthetic audit rows from the numbering backfill cleaned in `20260926092900`.
- Evidence of numbering -> `node scripts/verify-steps.mjs` -> `RFI/2026/0001…0004`, `QTN/2026/0001…0004`, `commission_receivable 796500.00`, KPI views populated.
- Pure KPI engine -> `npm test` -> `critical KPIs` suite passes (ratios, and null instead of an invented number when there is no data).
- Master data, audit page, print-to-PDF quotation, CSV export, "My RFIs", auto commission calculation -> `node scripts/verify-page.mjs` -> `ALL PAGES OK` including `/customers`, `/products`, `/admin/audit`, `/quotations/…/print`, and `/api/export` returning `text/csv` with header `client,po_count,total_value`.
- Every role's menu still loads -> `node scripts/verify-roles.mjs` -> `ALL ROLE MENUS AND PAGES OK` (owner 16 pages, sales/operations 9, finance 10).

## Input Sheet / Master Data Inputs coverage (26 Sep)

- Pulled the live column list (`information_schema.columns`) for every stage table -> found the exact remaining gaps.
- Closed them -> migration `20260926093000_input_sheet_field_gaps.sql`, `npm run db:push` -> applied; `npm run gen:types` -> `Wrote src/lib/database.types.ts`.
  - RFI: associated OEM, remarks; surfaced quotation validity, staggered delivery and assigned employee on the New RFI form.
  - Quotation: OEM quotation number, quotation date, unit price, quantity (form + payload + print).
  - Commission: invoice date, payment due date, remarks, gross invoice value.
  - Auto references: `MR/YYYY/NNNN`, `PDI/YYYY/NNNN`, `DLV/YYYY/NNNN` via triggers; PDI linked-item select added.
- Evidence -> `npx vitest run tests/sql/recovered-requirements.test.ts` -> `Tests 7 passed`, including `assigns MR/PDI/DLV numbers on insert`.
- Full checks -> `npm test` -> `Tests 62 passed`; `npm run build` -> `✓ Compiled successfully`; `node scripts/verify-page.mjs` -> `ALL PAGES OK`; `node scripts/verify-roles.mjs` -> `ALL ROLE MENUS AND PAGES OK`.
- Field-by-field coverage table recorded in `REPORT.md` ("Workbook coverage"). Master Data Inputs is complete; the only Input Sheet items left are notifications/integrations deferred by TECH-STACK.

## Reports grouped, master data seeded and linked, process flow (26 Sep)

- Reports grouped exactly as the sheet groups them -> rewrote `src/app/reports/page.tsx` into bold **Sales Reports**, **Operational Reports**, **Financial Reports** and a Performance & Documents group; added a PDI status report and split GST and TDS into their own panels -> `node scripts/verify-page.mjs` -> `/reports` contains `Sales Reports: true`, `Operational Reports: true`, `Financial Reports: true`.
- PDI status view -> migration `20260926093100` (`v_pdi_status`); CSV export list already covers the new panels.
- Customer and Parts tables were empty because nothing seeded them and nothing linked them. Added demo Customer Master (3), contacts (2) and Part Master (4) to `supabase/seed.sql`, and linked the stages -> `npm run db:seed` -> `Seed applied. oems now: 3`; `node scripts/verify-steps.mjs` -> `customers 3, products 4, requirements_linked_customer 4, lines_linked_product 4, pos_linked_customer 1`.
- Going forward, new records link automatically: the RFI action matches `customers.customer_id` by agency name and `line_items.product_id` by part number; the PO action matches `purchase_orders.customer_id`.
- Process flow page showing Sheet1's nine stages, the linking key, the gate and live record counts -> `/process`; `node scripts/verify-page.mjs` -> `/process HTTP 200 contains "Order management stages": true`; `node scripts/verify-roles.mjs` -> every role loads it (`Process flow` in each menu, 10-17 pages OK).
- Full checks -> `npm test` -> `Tests 62 passed`; `npm run build` -> `✓ Compiled successfully`.

## Vibrant theme, GitHub push, Vercel attempt (26 Sep)

- Member: colours looked dull/dark. Reworked the theme to a light, vibrant look -> `globals.css` (purple-indigo + violet gradient primary, cyan/amber/green/rose status, soft card shadows, gradient nav active state, light rail) and `app-shell.tsx` / `nav-links.tsx` (light rail, brand gradient chip) -> `npm run build` -> `✓ Compiled successfully`.
- Git + GitHub -> `git init -b main`, `git add -A`, commit `341d0d8`, `git remote add origin https://github.com/realdevstack/Inverbras.git`, `gh auth setup-git`, `git push -u origin main` -> `* [new branch] main -> main`. `gh repo view realdevstack/Inverbras` -> default branch `main`, pushedAt `2026-09-26T18:49:08Z`.
- Secret check -> `git ls-files | Select-String .env` -> only `.env.example`; `grep supabase/admin src` -> imported only by `admin/actions.ts` and `admin/users/page.tsx` (both server-side), so the service-role key never reaches the browser.
- Vercel -> `npx --yes vercel@latest whoami` -> `Error: Worker timed out after 10 seconds`; no `~/.vercel/auth.json` and no `VERCEL_TOKEN`, so the CLI cannot log in from here. BLOCKED; dashboard import steps and the env-var list recorded in `REPORT.md`.

## Inverbras logo and rename (26 Sep)

- Member supplied the logo (gold hexagon, navy 'E' monogram, "Inverbras Electricals Pvt Ltd") -> recreated it as scalable SVG in `public/logo.svg` (full) and `public/logo-mark.svg` (rail mark) and added `src/components/brand.tsx`; used in the nav rail and on `/login` -> `curl http://localhost:3000/logo.svg` -> `200`.
- Renamed the display name "Inverbrass" -> "Inverbras" everywhere (app name, shell, login, health, docs, comments; package name `inverbras-crm`) -> `Select-String src -Pattern Inverbrass` -> 0 capital occurrences. The demo logins keep `@inverbrass.demo` and password `Inverbrass#2026` because those accounts exist in Supabase auth and renaming them would break sign-in.
- Diagnosed the live 500 -> `curl https://inverbrass.vercel.app/health` -> the page reports `NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY` missing (`no`); `SUPABASE_SERVICE_ROLE_KEY` present. Added `src/app/error.tsx` so this shows a message that links to `/health` instead of a blank error.
- Checks -> `npm run typecheck` clean, `npm run lint` clean, `npm run build` -> `✓ Compiled successfully`; `/login` renders the logo and "Inverbras".
- Member said the drawn logo was wrong, then saved the real artwork as `public/Inverbras-logo.jpg` (1376x768). Wired the **real JPG** as the full logo and cropped the hexagon to `public/logo-mark.png` (413x503) with System.Drawing for the rail; deleted the drawn SVGs. No SVG conversion needed — a raster->SVG would only wrap the JPG (or need lossy tracing).
- Evidence -> `/Inverbras-logo.jpg -> 200`, `/logo-mark.png -> 200`, and `/login` renders `/_next/image?url=%2FInverbras-logo.jpg`; `npm run typecheck` clean, `npm run lint` clean.

## Palette matched to inverbras.in (26 Sep)

- Member asked the app to match inverbras.in. Pulled the site palette -> `curl http://inverbras.in/css/style.css` -> dominant brand colours `#0b3d91` (deep blue), `#2d6cdf` (blue), `#ffcc00` (gold), `#5cb85c` (green), `#f0ad4e` (amber), `#d9534f` (red) — the same blue + gold as the logo.
- Rethemed `globals.css` to those tokens (blue gradient primary, gold accent class, blue/gold background wash, plus `--color-progress` so `text-progress` actually resolves) -> `npm run build` -> `✓ Compiled successfully`; `node scripts/verify-page.mjs` -> `ALL PAGES OK`.

## Compact layout + login check (27 Sep)

- Member: "compact". Ran a density pass -> base type 15px, panel radius/shadow reduced, button/input/nav padding trimmed, header 48px, rail 208px, main padding `py-4`, and an unlayered `table th/td { padding-block: .4rem }` rule so table rows compress over the utility padding -> `npm run build` -> `✓ Compiled successfully`.
- Member: operations@ and finance@ logins "not working". Reproduced -> `node scripts/_logins.mjs` -> all six accounts sign in against Supabase (`ok`), roles active, confirmed, not banned. End-to-end -> `node scripts/verify-roles.mjs` -> `operations pages: 10/10 OK`, `finance pages: 11/11 OK`, `ALL ROLE MENUS AND PAGES OK`. So the credentials and the app are fine locally; the live site fails for every user until the two `NEXT_PUBLIC_` variables are set on Vercel (see Deployment).
- Note: background dev servers started here are reaped between turns; start `npm run dev` in a terminal to test.

## Final verification

- `npm run typecheck` -> no output (clean).
- `npm run lint` -> no output (clean).
- `npm test` -> `Test Files 13 passed (13)`, `Tests 62 passed (62)`.
- `npm run build` -> `✓ Compiled successfully`, all 40 routes emitted (dashboard, RFI, OEM, customers, parts, sourcing, quotations + print, orders, delivery, finance, documents, reports, process, assistant, schema, audit, users, exports).
- `node scripts/verify-page.mjs` -> `ALL PAGES OK` across steps 1-14 and the recovered-requirement pages, plus the unauthenticated 307 to `/login`.
- `node scripts/verify-roles.mjs` -> each role has a distinct menu and every offered page loads; only the Owner sees `Users & roles`.

## Business flow logic (27 Sep)

- Reviewed the seven rules against the live schema and found two real gaps: the PO gate accepted `submitted` / `awaiting_approval` (not an approval), and nothing stopped a delivery or payment exceeding the invoice. -> migration `20260926093200_business_flow_rules.sql` -> `Applying migration 20260926093200_business_flow_rules.sql...`, `Finished supabase db push.`
  - `enforce_po_quotation_approved()` now requires `has_two_level_approval('quotation', …)` instead of a status list; `submitted` / `won` still pass because their approval rows remain, but a draft or one-level approval is refused. The historical-import exemption (`app.import_mode`) is kept.
  - New triggers `deliveries_within_invoice_quantity` and `payments_within_invoice_amount` reject a running total beyond the invoiced quantity / gross amount, so "partial" cannot silently become an over-run.
- Rule-by-rule SQL tests -> `npx vitest run tests/sql/business-flow.test.ts` -> `Test Files 1 passed (1)`, `Tests 10 passed (10)`: quotation without an RFI refused; PO without/with one-level approval refused, PO from a `submitted` quotation with both approvals allowed; two invoices per PO; two partial deliveries summing to the invoice and a third refused; commission refused on a part payment and allowed once paid; part payments reduce the balance to zero and an over-payment is refused; an insert audit row for every stage and an update row naming `status`.
- App-side edge guards mirror the DB caps -> `recordPaymentAction` and `recordDeliveryAction` now reject an amount/quantity above the outstanding balance with a clear reason before the insert -> `npm run typecheck` clean.
- Surfaced the rules on the process page -> `src/app/process/page.tsx` now lists "Business flow rules" with how each is enforced -> temp signed-in check -> `/process -> HTTP 200 contains "Business flow rules": true`.
- Latent defect surfaced by `npm run gen:types`: the live customers column is `inverbrass_vendor_registration` but the app read/wrote `Inverbras_vendor_registration` (wrong case and spelling), so the customer create/detail path could never write or read that field. -> migration `20260926093300_customer_vendor_registration_column.sql` renames it to `inverbras_vendor_registration`; updated `validation/master.ts`, `master-forms.tsx`, `customers/[id]/page.tsx` and `supabase/seed.sql` -> `npm run db:push` applied, `npm run db:seed` -> `Seed applied. oems now: 3`, signed-in check -> `/customers/33333333-…331 -> HTTP 200 contains "IB-VEND-0007": true`.
- Full checks -> `npm test` -> `Test Files 14 passed (14)`, `Tests 72 passed (72)`; `npm run gen:types` -> wrote `src/lib/database.types.ts`; `npm run typecheck` clean; `npm run lint` clean; `npm run build` -> `✓ Compiled successfully` (40 routes); `node scripts/verify-page.mjs` -> `ALL PAGES OK`.

## Automation requirements validation (27 Sep)

- Validated the ten automation requirements against the live schema and code (read-only) -> temp query of `pg_trigger`/`pg_proc` -> `TABLES WITHOUT AN AUDIT TRIGGER: ["audit_log","quotation_versions"]` (every business table is audited; the two excluded are the log itself and a derived snapshot of `quotations`); `AUTO-NUMBER TRIGGERS:` `requirements→set_rfi_number`, `quotations→set_quotation_number`, `material_readiness→set_readiness_number`, `pdis→set_pdi_number`, `deliveries→set_delivery_number`; `DASHBOARD METRICS:` `{"total_rfis":"4","open_pos":"1","overdue_invoices":"0","documents_expiring":"1","commission_receivable":"796500.00"}`.
- Result: DONE — RFI numbering, quotation numbering, approval workflow (quotation + order), auto commission, auto dashboard, audit logs. PARTIAL (in-app only, no outbound) — payment-due visibility, document-expiry reminders. MISSING — email reminders, escalation workflow for overdue payments (no mail provider and no cron/scheduler exist in the repo; TECH-STACK defers outbound messaging to Phase 2). Recorded in `REPORT.md`.

## Reminder email placeholders (27 Sep)

- Wrote the email templates as pure, tested modules (no provider, no sending) -> `src/lib/rules/email-templates.ts` -> five templates: RFI deadline reminder, payment due reminder, overdue payment escalation, document expiry reminder, OEM certification expiry reminder; each returns `{ to, subject, body }` and the catalogue lists its merge fields.
- Added the `/notifications` page: the template catalogue with merge fields and a labelled sample, plus drafts filled from live records (overdue payments, documents expiring ≤90 days, OEM certifications expired/due-soon, RFIs inside their reminder window) and an "Open in mail client" `mailto:` link. Nothing is sent; the page says so.
- Nav item "Reminders & emails" (area `requirements`, so every role sees it) + a mail icon -> `src/components/app-shell.tsx`, `src/components/nav-links.tsx`; added to `scripts/verify-page.mjs` and `scripts/verify-roles.mjs`.
- Tests -> `npm test` -> `Test Files 15 passed (15)`, `Tests 78 passed (78)` (6 new email-template tests: subject/body content, INR formatting, escalation wording, expiry state wording, catalogue coverage).
- Build + live evidence (production server started on a spare port by a temporary script, then stopped) -> `npm run build` -> `✓ Compiled successfully` incl. `ƒ /notifications`; live fetch -> `/notifications -> HTTP 200 contains "Reminder emails": true`, `contains "Template catalogue": true`, `contains "Open in mail client": true`; `grouphead / management / sales / operations / finance: menu has Reminders=true, /notifications HTTP 200`. Temp script removed after use.

## Communicate icons on the dashboard and finance (27 Sep)

- Built the placeholder channel links -> `src/components/contact-actions.tsx` (email `mailto:`, WhatsApp `https://wa.me/…`, phone `tel:`; a channel with nothing on file renders greyed-out and disabled), plus `src/lib/rules/contacts.ts` (`pickPrimaryContact`, `toWhatsAppNumber` with the 91 default) and `src/lib/data/reach.ts` (one read of the customer/OEM master contacts, helpers per row).
- Wired them where a follow-up happens:
  - Dashboard "Overdue payments" rows: Customer icons; new "Pending OEM invoices" subsection (invoice, balance, due/overdue) with Customer + OEM icons.
  - Dashboard "Documents expiring" rows: OEM icons to chase the renewal.
  - Finance invoice table: a Contact column with Customer + OEM icons per invoice.
  - A legend explains they are placeholders and that a greyed icon means no contact on file; nothing is sent automatically.
- Tests -> `npm test` -> `Test Files 16 passed (16)`, `Tests 83 passed (83)` (4 new contact-helper tests; one caught a real ordering bug in `pickPrimaryContact` — it returned a non-primary when the primary had no channel — fixed).
- Evidence -> `npm run typecheck` clean, `npm run lint` clean, `npm run build` -> `✓ Compiled successfully`; live fetch (prod server started on a spare port, then stopped) -> `/ has mailto: true, wa.me: true, tel: true, legend: true`; `/finance has mailto: true, wa.me: true, tel: true`; dashboard sample `wa.me/919000000001` (Bharat Dynamics contact on the expiring DGQA certificate); `node scripts/verify-page.mjs` -> `ALL PAGES OK` incl. the new `/ has wa.me` and `/finance has wa.me` checks. Temp scripts removed after use.

## Review fixes on the communication placeholders (27 Sep)

- Ran `/review uncommitted` -> 3 findings (1 warning, 2 suggestions); fixed all three:
  1. Customer contact was matched by free-text name, so it silently disappeared when the master was renamed. -> migration `20260926093400_invoice_views_customer_id.sql` appends `po.customer_id` to `v_invoice_balances` and `v_followup_tracker` (appended, not reordered, so `create or replace view` keeps columns/grants); `npm run db:push` -> `Applying migration 20260926093400_invoice_views_customer_id.sql...`, `Finished supabase db push.`; `reach.ts` now keys customers by id with the name path as fallback; dashboard and finance call `forCustomerId(...) ?? forCustomer(...)`.
  2. Raw email in `mailto:` could inject recipients/body. -> `sanitizeEmailAddress()` strips CR/LF and `? # &`; `ContactActions` uses the sanitized address and derives the enabled/title state from it.
  3. `buildReachIndex()` scanned the full master tables on every request. -> it now takes a scope (`customerIds`, `customerNames`, `oemIds`) and reads only those rows, returning an empty index when nothing is requested; both pages pass the ids/names of the rows they actually render.
- Tests -> `npm test` -> `Test Files 16 passed (16)`, `Tests 84 passed (84)` (new `sanitizeEmailAddress` cases).
- Evidence -> `npm run typecheck` clean, `npm run lint` clean, `npm run build` -> `✓ Compiled successfully`; live fetch (prod server started on a spare port, then stopped) -> `/finance customer resolved by id (HAL contact): true` (`a.sharma@example.invalid` present, proving the id link works), `/ has no injected email: true`, mailto/wa.me/tel present on `/` and `/finance`; `node scripts/verify-page.mjs` -> `ALL PAGES OK`. Temp scripts removed after use.

## Committed, pushed and deployed (27 Sep)

- Staged and committed the communication-placeholder work -> `git add -- <11 files>`; `git commit -m "feat(comms): email/WhatsApp/call placeholders on dashboard and finance" ...` -> `[main 42f2465] ... 11 files changed, 585 insertions(+), 19 deletions(-)`.
- Pushed -> `git push origin main` -> `081b555..42f2465  main -> main`; `git ls-remote --heads origin` -> `42f246556b888df68aab66f0d53ad3179abc6356 refs/heads/main`.
- Vercel: the CLI cannot authenticate from this machine (no `~/.vercel/auth.json`, no `VERCEL_TOKEN`; `npx vercel whoami` hangs on interactive login, then the shell times out). The project is connected to the GitHub repo, so the push triggered a production deploy -> after ~2 minutes, live fetch (signed in) -> `https://inverbrass.vercel.app/` -> `wa.me:true mailto:true oemEmail:true`; `/finance` -> `wa.me:true customerEmail:true oemEmail:true`; `/notifications` -> `Template catalogue:true`.

## Pictorial process flow (27 Sep)

- Rebuilt `src/app/process/page.tsx` into a visual flow, no diagram library: a horizontal chain of the nine stages with arrows and live counts plus a legend, and the stage detail drawn as a vertical timeline (numbered nodes + connector line), keeping the master-data and business-rule panels. Added `await check("/process", "Process flow at a glance")` to `scripts/verify-page.mjs`.
- Checks -> `npm run typecheck` clean; `npm run lint` clean; `npm run build` -> `✓ Compiled successfully`; signed-in fetch -> `http://localhost:3000/process -> HTTP 200`, contains "Process flow at a glance": true, "Step 9": true, "Commission invoice": true, "Order management stages": true, 18 arrow glyphs.
- Committed and pushed; the GitHub-connected Vercel project redeployed -> live fetch -> `https://inverbrass.vercel.app/process` contains "Process flow at a glance": true.
