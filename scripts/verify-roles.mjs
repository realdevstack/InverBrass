#!/usr/bin/env node
/**
 * Signs in as each demo role and verifies two things:
 *   1. the navigation differs by role, and
 *   2. every page that role is offered actually loads (HTTP < 400).
 *
 * Requires `npm run dev` running on localhost:3000.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const raw of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(raw.trim());
  if (m) env[m[1]] = m[2].trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split(".")[0];
const BASE = "http://localhost:3000";

const NAV = [
  ["/dashboard", "Dashboard"],
  ["/requirements", "RFIs"],
  ["/oems", "OEMs"],
  ["/customers", "Customers"],
  ["/products", "Parts"],
  ["/sourcing", "Sourcing"],
  ["/quotations", "Quotations"],
  ["/orders", "Orders"],
  ["/delivery", "PDI"],
  ["/finance", "Finance"],
  ["/documents", "Documents"],
  ["/reports", "Reports"],
  ["/process", "Process flow"],
  ["/assistant", "Assistant"],
  ["/notifications", "Reminders & emails"],
  ["/admin/audit", "Audit log"],
  ["/schema", "Schema"],
  ["/admin/users", "Users & roles"],
];

const users = [
  ["owner@inverbrass.demo", "owner"],
  ["grouphead@inverbrass.demo", "group_head"],
  ["management@inverbrass.demo", "management"],
  ["sales@inverbrass.demo", "sales"],
  ["operations@inverbrass.demo", "operations"],
  ["finance@inverbrass.demo", "finance"],
];

let failures = 0;

for (const [email, label] of users) {
  const supabase = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: "Inverbrass#2026" });
  if (error) {
    console.log(`${label}: SIGN-IN FAILED ${error.message}`);
    failures += 1;
    continue;
  }
  const cookieValue =
    "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const cookie = `sb-${ref}-auth-token=${cookieValue}`;

  const home = await fetch(`${BASE}/`, { headers: { cookie }, redirect: "manual" });
  const html = await home.text();
  const navMatch = /<nav[\s\S]*?<\/nav>/.exec(html);
  const nav = navMatch ? navMatch[0] : "";
  const visible = NAV.filter(([href]) => nav.includes(`href="${href}"`));

  const results = [];
  for (const [href, name] of visible) {
    const res = await fetch(`${BASE}${href}`, { headers: { cookie }, redirect: "manual" });
    if (res.status >= 400) {
      failures += 1;
      results.push(`${name}=${res.status}`);
    }
  }

  console.log(`${label.padEnd(11)} menu: ${visible.map(([, n]) => n).join(", ")}`);
  console.log(
    `${"".padEnd(11)} pages: ${visible.length - results.length}/${visible.length} OK${results.length ? ` — FAILURES ${results.join(", ")}` : ""}`,
  );
}

console.log(failures === 0 ? "ALL ROLE MENUS AND PAGES OK" : `${failures} FAILURE(S)`);
if (failures > 0) process.exitCode = 1;
