#!/usr/bin/env node
/**
 * Creates the six demo users (one per role) through the Supabase Admin API, so
 * GoTrue populates every auth column and identity itself. DEMO ONLY — the
 * password below is not a secret and these accounts must not exist on a
 * production project.
 *
 * Idempotent and self-healing: any existing @inverbrass.demo account is removed
 * and recreated, so a previously hand-inserted (broken) row is repaired.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * The secret key is used here and nowhere in the app.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const text = readFileSync(join(root, ".env.local"), "utf8");
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(raw.trim());
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const DEMO_PASSWORD = "Inverbrass#2026";
const USERS = [
  ["owner@inverbrass.demo", "owner", "Ram Prasad (Owner)"],
  ["grouphead@inverbrass.demo", "group_head", "Group Head"],
  ["management@inverbrass.demo", "management", "Management"],
  ["sales@inverbrass.demo", "sales", "Sales User"],
  ["operations@inverbrass.demo", "operations", "Operations User"],
  ["finance@inverbrass.demo", "finance", "Finance User"],
];

// Purge any existing demo accounts directly in SQL first. A hand-inserted row
// with NULL auth columns makes GoTrue's own user queries fail, so listUsers
// cannot be trusted to clean up; SQL can.
if (!env.SUPABASE_DB_URL) throw new Error("SUPABASE_DB_URL must be set in .env.local");
const sql = postgres(env.SUPABASE_DB_URL, { max: 1, ssl: "require", prepare: false, onnotice: () => {} });
try {
  const removed = await sql`
    delete from auth.users where email like '%@inverbrass.demo' returning email
  `;
  for (const row of removed) console.log(`removed old ${row.email}`);
} finally {
  await sql.end();
}

for (const [email, role, fullName] of USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) throw error;

  const { error: roleError } = await admin
    .from("user_roles")
    .upsert({ user_id: data.user.id, role, full_name: fullName }, { onConflict: "user_id" });
  if (roleError) throw roleError;

  console.log(`created ${email} as ${role}`);
}

const { data: roles } = await admin.from("user_roles").select("role, full_name");
console.log("user_roles:", JSON.stringify(roles));
