#!/usr/bin/env node
/**
 * Proves the app's own data path works with the publishable key: sign in, then
 * read through RLS. Prints counts only, never tokens.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const text = readFileSync(join(root, ".env.local"), "utf8");
const env = {};
for (const raw of text.split(/\r?\n/)) {
  const match = /^([A-Z_]+)=(.*)$/.exec(raw.trim());
  if (match) env[match[1]] = match[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function clientFor(email) {
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: "Inverbrass#2026" });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

const owner = await clientFor("owner@inverbrass.demo");
const coverage = await owner.from("v_requirement_coverage").select("requirement_id");
console.log(`owner v_requirement_coverage rows: ${coverage.data?.length ?? 0}`);

const docs = await owner.from("documents").select("id");
console.log(`owner documents rows: ${docs.data?.length ?? 0}`);

const sales = await clientFor("sales@inverbrass.demo");
const salesReqs = await sales.from("requirements").select("id");
console.log(`sales requirements rows: ${salesReqs.data?.length ?? 0}`);
const salesFinance = await sales.from("commission_invoices").select("id");
console.log(`sales commission_invoices rows: ${salesFinance.data?.length ?? 0}`);

const finance = await clientFor("finance@inverbrass.demo");
const financeInvoices = await finance.from("commission_invoices").select("id");
console.log(`finance commission_invoices rows: ${financeInvoices.data?.length ?? 0}`);

// Private-bucket round trip: upload, signed URL, fetch, clean up.
const path = `demo/verify-${crypto.randomUUID()}.txt`;
const upload = await owner.storage
  .from("documents")
  .upload(path, new Blob(["storage round trip"], { type: "text/plain" }), { contentType: "text/plain" });
console.log(`owner storage upload ok: ${!upload.error}`);
const signed = await owner.storage.from("documents").createSignedUrl(path, 60);
console.log(`signed url created: ${Boolean(signed.data?.signedUrl)}`);
if (signed.data?.signedUrl) {
  const fetched = await fetch(signed.data.signedUrl);
  console.log(`signed url fetch: HTTP ${fetched.status}`);
}
const removed = await owner.storage.from("documents").remove([path]);
console.log(`cleanup removed: ${!removed.error}`);
