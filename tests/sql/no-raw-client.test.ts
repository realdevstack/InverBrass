import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guard: the raw `postgres` client is a test-only dependency. No application
 * code may import it, or it would bypass RLS (TECH-STACK HARD EXCLUSIONS).
 */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("raw database client exclusion", () => {
  it("is never imported from src/", () => {
    const offenders = walk(join(process.cwd(), "src")).filter((file) => {
      const text = readFileSync(file, "utf8");
      return /from\s+["']postgres["']|require\(["']postgres["']\)/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
