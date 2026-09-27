#!/usr/bin/env node
/**
 * Signs in, builds the same auth cookie @supabase/ssr expects, and fetches the
 * signed-in pages to prove they render. Prints status codes and a boolean for
 * expected content, never the token.
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
const ref = new URL(url).hostname.split(".")[0];

const supabase = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await supabase.auth.signInWithPassword({
  email: "owner@inverbrass.demo",
  password: "Inverbrass#2026",
});
if (error) throw error;

const cookieValue =
  "base64-" +
  Buffer.from(JSON.stringify(data.session)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const cookie = `${ref ? `sb-${ref}-auth-token` : "sb-auth-token"}=${cookieValue}`;

let failures = 0;

async function check(path, needle) {
  const res = await fetch(`http://localhost:3000${path}`, { headers: { cookie }, redirect: "manual" });
  const body = res.status < 400 ? await res.text() : "";
  const ok = res.status < 400 && (!needle || body.includes(needle));
  if (!ok) failures += 1;
  console.log(
    `${path} -> HTTP ${res.status}${needle ? ` contains "${needle}": ${body.includes(needle)}` : ""}${ok ? "" : "  <-- FAIL"}`,
  );
  return body;
}

const SEEDED = {
  requirement: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
  oem: "11111111-1111-1111-1111-111111111111",
  quotation: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
  po: "ffffffff-ffff-ffff-ffff-fffffffffff1",
  invoice: "88888888-8888-8888-8888-888888888881",
};

// Steps 1-4
await check("/requirements", "Airborne Radio Set");
await check(`/requirements/${SEEDED.requirement}`, "Quantity coverage");
await check("/", "Dashboard");
await check("/schema", "requirements");

// Step 5 — OEM master
await check("/oems", "OEM master");
await check(`/oems/${SEEDED.oem}`, "Bharat Dynamics");
await check("/oems/expiring", "Certification expiry");

// Step 6 — sourcing and coverage
await check("/sourcing", "Per-requirement coverage");
await check(`/sourcing/${SEEDED.requirement}`, "Line coverage");

// Step 7 — history loaded (past-bid view)
await check("/quotations", "bid intelligence");

// Step 8 — quotation and bid intelligence
await check(`/quotations/${SEEDED.quotation}`, "Past-bid intelligence");

// Step 9 — purchase order
await check("/orders", "Purchase orders");
await check(`/orders/${SEEDED.po}`, "Order verification");

// Step 10 — material readiness, PDI, LD risk
await check("/delivery", "LD risk");
await check(`/delivery/${SEEDED.po}`, "Material readiness");

// Step 11 — finance
await check("/finance", "OEM invoices");
await check(`/finance/${SEEDED.invoice}`, "Payments");

// Step 12 — document vault
await check("/documents", "Document");

// Step 13 — reports and dashboard
await check("/reports", "Sales Reports");
await check("/reports", "Operational Reports");
await check("/reports", "Financial Reports");
await check("/process", "Order management stages");
await check("/process", "Process flow at a glance");

// Communication placeholders (email / WhatsApp / phone links)
await check("/", "wa.me");
await check("/finance", "wa.me");

// Recovered requirements — master data, audit, numbering, print, export
await check("/customers", "Customer master");
await check("/products", "Parts master");
await check("/requirements/new", "Associated OEM");
await check("/customers/new", "Customer name");
await check("/products/new", "OEM mapping");
await check("/quotations/new", "OEM quotation number");
await check("/admin/audit", "Audit log");
await check("/quotations/dddddddd-dddd-dddd-dddd-ddddddddddd1/print", "Quotation");
const exportRes = await fetch("http://localhost:3000/api/export?report=revenue-by-client", { headers: { cookie } });
const exportBody = exportRes.status === 200 ? await exportRes.text() : "";
const exportOk = exportRes.status === 200 && exportRes.headers.get("content-type")?.includes("text/csv");
if (!exportOk) failures += 1;
console.log(`/api/export?report=revenue-by-client -> HTTP ${exportRes.status} csv=${exportOk} firstLine="${exportBody.split(/\r?\n/)[0]}"`);

// Step 14 — assistant
await check("/assistant", "off by default");

// Reminder email placeholders (no sending)
await check("/notifications", "Reminder emails");
const assistant = await fetch("http://localhost:3000/api/assistant", {
  method: "POST",
  headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ question: "how many orders are there?" }),
});
const assistantBody = await assistant.json();
const assistantOk = assistant.status === 200 && assistantBody.source === "deterministic";
if (!assistantOk) failures += 1;
console.log(
  `/api/assistant (no key) -> HTTP ${assistant.status} source=${assistantBody.source} answer="${assistantBody.answer}"`,
);

// Sanity: a wrong cookie must still be bounced to the login page.
const anonRes = await fetch("http://localhost:3000/requirements", { redirect: "manual" });
console.log(`/requirements without cookie -> HTTP ${anonRes.status} location=${anonRes.headers.get("location")}`);
if (anonRes.status !== 307) failures += 1;

console.log(failures === 0 ? "ALL PAGES OK" : `${failures} CHECK(S) FAILED`);
if (failures > 0) process.exitCode = 1;
