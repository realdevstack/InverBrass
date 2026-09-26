import { describe, expect, it } from "vitest";

import { asUser, createUser, expectFailure, inRollback, seedQuotation, sql } from "./helpers";

const SEEDED_INVOICE = "88888888-8888-8888-8888-888888888881";
const SEEDED_REQUIREMENT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1";

describe("row level security", () => {
  it("lets a sales user read requirements", async () => {
    await inRollback(async (db) => {
      const sales = await createUser(db, "sales");
      await asUser(db, sales, async () => {
        const rows = await db<{ id: string }[]>`select id from public.requirements limit 5`;
        expect(rows.length).toBeGreaterThan(0);
      });
    });
  });

  it("denies a sales user finance data (read)", async () => {
    await inRollback(async (db) => {
      const sales = await createUser(db, "sales");
      await asUser(db, sales, async () => {
        const rows = await db`select id from public.commission_invoices`;
        expect(rows.length).toBe(0);
      });
    });
  });

  it("denies a sales user writing a commission invoice", async () => {
    await inRollback(async (db) => {
      const sales = await createUser(db, "sales");
      await asUser(db, sales, async () => {
        await expectFailure(
          () =>
            db`
              insert into public.commission_invoices
                (commission_invoice_number, oem_invoice_id, commission_percentage, base_invoice_amount, commission_amount)
              values (${"CI-RLS-" + crypto.randomUUID()}, ${SEEDED_INVOICE}, 5, 100, 5)
            `,
          /row-level security/i,
        );
      });
    });
  });

  it("denies finance writing requirements and operations writing quotations", async () => {
    await inRollback(async (db) => {
      const finance = await createUser(db, "finance");
      const operations = await createUser(db, "operations");
      const { requirementId } = await seedQuotation(db); // seeded as the owner

      await asUser(db, finance, async () => {
        await expectFailure(
          () =>
            db`insert into public.requirements (project_name, customer_agency) values ('Nope', 'Nope')`,
          /row-level security/i,
        );
      });

      await asUser(db, operations, async () => {
        await expectFailure(
          () => db`insert into public.quotations (requirement_id, status) values (${requirementId}, 'draft')`,
          /row-level security/i,
        );
      });
    });
  });

  it("shows a user only their own role", async () => {
    await inRollback(async (db) => {
      const sales = await createUser(db, "sales");
      const finance = await createUser(db, "finance");
      await asUser(db, sales, async () => {
        const rows = await db<{ role: string }[]>`select role from public.user_roles`;
        expect(rows).toHaveLength(1);
        expect(rows[0].role).toBe("sales");
      });
      await asUser(db, finance, async () => {
        const rows = await db<{ role: string }[]>`select role from public.user_roles`;
        expect(rows).toHaveLength(1);
        expect(rows[0].role).toBe("finance");
      });
    });
  });
});

describe("audit trail", () => {
  it("records who changed what, and only privileged roles can read it", async () => {
    await inRollback(async (db) => {
      const owner = await createUser(db, "owner");
      const sales = await createUser(db, "sales");

      await asUser(db, owner, async () => {
        await db`
          update public.requirements set project_name = 'Renamed requirement'
          where id = ${SEEDED_REQUIREMENT}
        `;
        const rows = await db<
          { actor_id: string; changed_fields: string[]; table_name: string }[]
        >`
          select actor_id, changed_fields, table_name
          from public.audit_log
          where table_name = 'requirements' and record_id = ${SEEDED_REQUIREMENT}
          order by at desc
          limit 1
        `;
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].actor_id).toBe(owner);
        expect(rows[0].changed_fields).toContain("project_name");
      });

      await asUser(db, sales, async () => {
        const rows = await db`select id from public.audit_log`;
        expect(rows.length).toBe(0);
      });
    });
  });
});

describe("two-level approval", () => {
  it("refuses Management before Group Head, and advances only after both", async () => {
    await inRollback(async (db) => {
      const groupHead = await createUser(db, "group_head");
      const management = await createUser(db, "management");
      const { quotationId } = await seedQuotation(db);

      await asUser(db, management, async () => {
        await expectFailure(
          () =>
            db`select public.record_approval('quotation_submitted', 'quotation', ${quotationId}, 'management', 'approved')`,
          /Group Head approval first/i,
        );
      });

      await asUser(db, groupHead, async () => {
        await db`select public.record_approval('quotation_submitted', 'quotation', ${quotationId}, 'group_head', 'approved')`;
      });

      const [afterOne] = await db<{ status: string }[]>`
        select status from public.quotations where id = ${quotationId}
      `;
      expect(afterOne.status).toBe("draft");

      await asUser(db, management, async () => {
        await db`select public.record_approval('quotation_submitted', 'quotation', ${quotationId}, 'management', 'approved')`;
      });

      const [afterTwo] = await db<{ status: string }[]>`
        select status from public.quotations where id = ${quotationId}
      `;
      expect(afterTwo.status).toBe("approved");
    });
  });

  it("refuses an approval from a non-approver role", async () => {
    await inRollback(async (db) => {
      const sales = await createUser(db, "sales");
      const { quotationId } = await seedQuotation(db);
      await asUser(db, sales, async () => {
        await expectFailure(
          () =>
            db`select public.record_approval('quotation_submitted', 'quotation', ${quotationId}, 'group_head', 'approved')`,
          /approver role/i,
        );
      });
    });
  });
});

describe("user administration (owner only)", () => {
  it("lets the Owner change another user's role, and refuses a non-owner", async () => {
    await inRollback(async (db) => {
      const owner = await createUser(db, "owner");
      const target = await createUser(db, "sales");

      await asUser(db, owner, async () => {
        await db`update public.user_roles set role = 'finance' where user_id = ${target}`;
        const [row] = await db<{ role: string }[]>`select role from public.user_roles where user_id = ${target}`;
        expect(row.role).toBe("finance");
      });

      // A non-owner's self-escalation matches no writable row: the UPDATE
      // silently changes nothing rather than erroring, so assert the role held.
      await asUser(db, target, async () => {
        await db`update public.user_roles set role = 'owner' where user_id = ${target}`;
        const [row] = await db<{ role: string }[]>`select role from public.user_roles where user_id = ${target}`;
        expect(row.role).toBe("finance");
      });
    });
  });

  it("cuts off access when the Owner deactivates a user", async () => {
    await inRollback(async (db) => {
      const owner = await createUser(db, "owner");
      const sales = await createUser(db, "sales");

      await asUser(db, sales, async () => {
        const rows = await db`select id from public.requirements limit 1`;
        expect(rows.length).toBeGreaterThan(0);
      });

      await asUser(db, owner, async () => {
        await db`update public.user_roles set is_active = false where user_id = ${sales}`;
      });

      await asUser(db, sales, async () => {
        const rows = await db`select id from public.requirements limit 1`;
        expect(rows.length).toBe(0);
      });
    });
  });
});

describe("seed sanity", () => {
  it("still has the demo data (used by the RLS assertions above)", async () => {
    const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from public.requirements`;
    expect(count).toBeGreaterThan(0);
  });
});
