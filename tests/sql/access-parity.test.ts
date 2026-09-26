import { describe, expect, it } from "vitest";

import { APP_ROLES, AREAS, READ_MATRIX, WRITE_MATRIX } from "@/lib/rules/access";
import { asUser, createUser, inRollback } from "./helpers";

/**
 * The app's navigation matrix (`src/lib/rules/access.ts`) is only a mirror of
 * the database helpers that RLS actually enforces. This test asserts the two
 * never drift, so a menu can never offer something RLS will deny.
 */
describe("role/area parity between the app and the database", () => {
  it("matches role_can_read and role_can_write for every role and area", async () => {
    await inRollback(async (db) => {
      for (const role of APP_ROLES) {
        const userId = await createUser(db, role);
        await asUser(db, userId, async () => {
          for (const area of AREAS) {
            const [read] = await db<{ can: boolean }[]>`select public.role_can_read(${area}) as can`;
            const [write] = await db<{ can: boolean }[]>`select public.role_can_write(${area}) as can`;
            expect(read.can, `${role} read ${area}`).toBe(READ_MATRIX[role].includes(area));
            expect(write.can, `${role} write ${area}`).toBe(WRITE_MATRIX[role].includes(area));
          }
        });
      }
    });
  });
});
