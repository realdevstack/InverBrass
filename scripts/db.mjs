#!/usr/bin/env node
/**
 * Thin wrapper around the Supabase CLI so every database command reads the
 * connection string from .env.local instead of a shell-specific export.
 *
 * Usage: node scripts/db.mjs <push|list|diff|migration:new|gen:types> [args...]
 *
 * The service-role key and the database URL never leave this process: they are
 * passed as environment/CLI arguments only, never printed.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "node_modules", "supabase", "dist", "supabase.js");

function loadEnvLocal() {
  const file = join(root, ".env.local");
  if (!existsSync(file)) return {};
  const out = {};
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const env = loadEnvLocal();
const dbUrl = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL;

function requireDbUrl() {
  if (!dbUrl) {
    fail("SUPABASE_DB_URL is not set. Add it to .env.local (see .env.example).");
  }
  return dbUrl;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function run(args, { dbUrl: needsDb = false, capture = false, input } = {}) {
  if (!existsSync(cli)) fail(`Supabase CLI not found at ${cli}. Run: npm install`);
  const finalArgs = [...args];
  if (needsDb) finalArgs.push("--db-url", requireDbUrl());
  const result = spawnSync(process.execPath, [cli, ...finalArgs], {
    cwd: root,
    encoding: "utf8",
    stdio: capture ? ["pipe", "pipe", "pipe"] : [input ? "pipe" : "inherit", "inherit", "inherit"],
    input,
  });
  if (result.error) fail(result.error.message);
  if (capture) {
    if (result.status !== 0) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      process.exit(result.status ?? 1);
    }
    return result.stdout ?? "";
  }
  process.exit(result.status ?? 1);
}

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case "push":
    // --include-all: apply every local migration even on a fresh remote whose
    // migration history is empty. Never run `db reset` against the hosted DB.
    run(["db", "push", "--include-all"], { dbUrl: true, input: "y\n" });
    break;
  case "list":
    run(["migration", "list"], { dbUrl: true });
    break;
  case "diff":
    run(["db", "diff", "--schema", "public"], { dbUrl: true });
    break;
  case "migration:new": {
    const name = rest.join(" ").trim();
    if (!name) fail("Usage: node scripts/db.mjs migration:new <name>");
    run(["migration", "new", name]);
    break;
  }
  case "gen:types": {
    const out = join(root, "src", "lib", "database.types.ts");
    mkdirSync(dirname(out), { recursive: true });
    const sql = run(["gen", "types", "typescript", "--schema", "public"], {
      dbUrl: true,
      capture: true,
    });
    writeFileSync(out, sql, "utf8");
    console.log(`Wrote ${out}`);
    break;
  }
  default:
    fail(`Unknown command: ${command ?? "(none)"}. Try push|list|diff|migration:new|gen:types`);
}
