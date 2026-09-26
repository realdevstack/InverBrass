#!/usr/bin/env node
/**
 * Applies supabase/seed.sql to the configured database. The same file is used
 * by `supabase db reset` locally (config.toml -> db.seed.sql_paths).
 *
 * Demo data only; never real client data. Idempotent: every insert is guarded,
 * so re-running does not duplicate rows.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.trim();
  const text = readFileSync(join(root, ".env.local"), "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const match = /^SUPABASE_DB_URL=(.*)$/.exec(raw.trim());
    if (match) return match[1].trim();
  }
  throw new Error("SUPABASE_DB_URL is not set (add it to .env.local).");
}

const sql = postgres(loadDbUrl(), { max: 1, ssl: "require", prepare: false, onnotice: () => {} });
const seed = readFileSync(join(root, "supabase", "seed.sql"), "utf8");

try {
  await sql.unsafe(seed);
  const [{ count }] = await sql`select count(*)::int as count from public.oems`;
  console.log(`Seed applied. oems now: ${count}`);
} finally {
  await sql.end();
}
