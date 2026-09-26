/**
 * SQL test harness.
 *
 * `postgres` is a TEST-ONLY dependency: it runs SQL-level assertions
 * (constraints, gates, RLS) against real Postgres. It is never imported by
 * application code — the app talks to Supabase through @supabase/ssr so RLS is
 * the single enforcement boundary. `tests/sql/no-raw-client.test.ts` guards that.
 *
 * A failed statement aborts a Postgres transaction, so expected failures are
 * isolated with savepoints; the outer transaction stays usable and is rolled
 * back at the end, leaving the database untouched.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres, { type Sql } from "postgres";

function loadDbUrl(): string {
  const fromEnv = process.env.SUPABASE_DB_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const file = join(process.cwd(), ".env.local");
  const text = readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const match = /^SUPABASE_DB_URL=(.*)$/.exec(raw.trim());
    if (match) return match[1].trim();
  }
  throw new Error("SUPABASE_DB_URL is not set (add it to .env.local).");
}

export const sql: Sql = postgres(loadDbUrl(), {
  max: 1,
  ssl: "require",
  prepare: false,
  onnotice: () => {},
});

/** Runs assertions inside a transaction that is always rolled back. */
export async function inRollback(fn: (db: Sql) => Promise<void>): Promise<void> {
  await sql.unsafe("begin");
  try {
    await fn(sql);
  } finally {
    await sql.unsafe("rollback");
  }
}

/**
 * Asserts a statement fails, inside a savepoint so the outer transaction keeps
 * working afterwards.
 */
export async function expectFailure(
  run: () => Promise<unknown>,
  pattern?: RegExp,
): Promise<void> {
  await sql.unsafe("savepoint expected_failure");
  let error: unknown;
  try {
    await run();
  } catch (caught) {
    error = caught;
  }
  await sql.unsafe("rollback to savepoint expected_failure");

  if (error === undefined) {
    throw new Error("Expected the statement to fail, but it succeeded.");
  }
  const message = error instanceof Error ? error.message : String(error);
  if (pattern && !pattern.test(message)) {
    throw new Error(`Expected failure matching ${pattern}, got: ${message}`);
  }
}

export type QuotationFixture = {
  requirementId: string;
  lineItemId: string;
  oemId: string;
  quotationId: string;
};

/** Minimal requirement + line item + OEM + draft quotation. */
export async function seedQuotation(db: Sql): Promise<QuotationFixture> {
  const [req] = await db<{ id: string }[]>`
    insert into public.requirements (project_name, customer_agency)
    values ('Test requirement', 'Test agency')
    returning id
  `;
  const [li] = await db<{ id: string }[]>`
    insert into public.line_items (requirement_id, line_no, part_number, quantity)
    values (${req.id}, 1, 'PN-TEST-1', 1000)
    returning id
  `;
  const [oem] = await db<{ id: string }[]>`
    insert into public.oems (name)
    values (${"OEM-" + crypto.randomUUID()})
    returning id
  `;
  const [q] = await db<{ id: string }[]>`
    insert into public.quotations (requirement_id, oem_id, line_item_id, status)
    values (${req.id}, ${oem.id}, ${li.id}, 'draft')
    returning id
  `;
  return {
    requirementId: req.id,
    lineItemId: li.id,
    oemId: oem.id,
    quotationId: q.id,
  };
}

/** Records both approval levels, then advances the quotation to approved. */
export async function approveQuotation(db: Sql, quotationId: string): Promise<void> {
  await db`
    insert into public.approvals (stage, entity_type, entity_id, level, decision, decided_at)
    values
      ('quotation_submitted', 'quotation', ${quotationId}, 'group_head', 'approved', now()),
      ('quotation_submitted', 'quotation', ${quotationId}, 'management', 'approved', now())
  `;
  await db`update public.quotations set status = 'approved' where id = ${quotationId}`;
}

export function uniquePoNumber(): string {
  return `PO-${crypto.randomUUID()}`;
}

export function uniqueInvoiceNumber(): string {
  return `INV-${crypto.randomUUID()}`;
}

export type AppRole = "owner" | "group_head" | "management" | "sales" | "operations" | "finance";

/** Creates an auth user with one role. Rolled back with the surrounding transaction. */
export async function createUser(db: Sql, role: AppRole): Promise<string> {
  const id = crypto.randomUUID();
  const email = `test-${id}@example.invalid`;
  await db`
    insert into auth.users
      (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       ${email}, '', now(),
       ${db.json({ provider: "email", providers: ["email"] })}, ${db.json({})}, now(), now())
  `;
  await db`
    insert into public.user_roles (user_id, role, full_name)
    values (${id}, ${role}::public.user_role, ${role})
  `;
  return id;
}

/** Runs `fn` as the `authenticated` role carrying `userId`'s JWT claims. */
export async function asUser<T>(db: Sql, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.unsafe("set local role authenticated");
  await db`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: "authenticated" })}, true)`;
  try {
    return await fn();
  } finally {
    await db.unsafe("reset role");
    await db`select set_config('request.jwt.claims', '', true)`;
  }
}
