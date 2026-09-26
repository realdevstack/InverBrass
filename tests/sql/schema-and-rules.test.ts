import { describe, expect, it } from "vitest";
import type { Sql } from "postgres";

import {
  approveQuotation,
  expectFailure,
  inRollback,
  seedQuotation,
  uniqueInvoiceNumber,
  uniquePoNumber,
} from "./helpers";

const EXPECTED_TABLES = [
  "requirements",
  "line_items",
  "oems",
  "oem_contacts",
  "sourcing_requests",
  "sourcing_responses",
  "quantity_commitments",
  "quotations",
  "quotation_versions",
  "purchase_orders",
  "material_readiness",
  "pdis",
  "oem_invoices",
  "deliveries",
  "payments",
  "commission_invoices",
  "documents",
  "approvals",
  "audit_log",
];

async function approvedPo(db: Sql, quotationId: string, requirementId: string) {
  await approveQuotation(db, quotationId);
  const [po] = await db<{ id: string }[]>`
    insert into public.purchase_orders
      (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value, taxes_gst)
    values
      (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'Test customer', 10, 100, 1000, 180)
    returning id
  `;
  return po;
}

describe("schema", () => {
  it("has every PRD table", async () => {
    await inRollback(async (db) => {
      const rows = await db<{ table_name: string }[]>`
        select table_name from information_schema.tables where table_schema = 'public'
      `;
      const names = rows.map((r) => r.table_name);
      expect(names).toEqual(expect.arrayContaining(EXPECTED_TABLES));
    });
  });
});

describe("quantity coverage (the spine)", () => {
  it("computes uncovered from firm commitments only, and flips when one is downgraded", async () => {
    await inRollback(async (db) => {
      const { requirementId, lineItemId, oemId } = await seedQuotation(db); // 1000 required
      const [oemB] = await db<{ id: string }[]>`
        insert into public.oems (name) values (${"OEM-B-" + crypto.randomUUID()}) returning id
      `;

      await db`
        insert into public.quantity_commitments (oem_id, requirement_id, line_item_id, quantity, firm, source)
        values
          (${oemId}, ${requirementId}, ${lineItemId}, 600, true, 'firm_quote'),
          (${oemB.id}, ${requirementId}, ${lineItemId}, 400, true, 'firm_quote')
      `;

      const [full] = await db<{ required_quantity: string; firm_committed: string; uncovered_quantity: string }[]>`
        select required_quantity, firm_committed, uncovered_quantity
        from public.v_line_item_coverage where line_item_id = ${lineItemId}
      `;
      expect(Number(full.required_quantity)).toBe(1000);
      expect(Number(full.firm_committed)).toBe(1000);
      expect(Number(full.uncovered_quantity)).toBe(0);

      await db`
        update public.quantity_commitments
        set firm = false, source = 'availability_indication'
        where oem_id = ${oemB.id}
      `;

      const [partial] = await db<
        { firm_committed: string; indicated_available: string; uncovered_quantity: string }[]
      >`
        select firm_committed, indicated_available, uncovered_quantity
        from public.v_line_item_coverage where line_item_id = ${lineItemId}
      `;
      expect(Number(partial.firm_committed)).toBe(600);
      expect(Number(partial.indicated_available)).toBe(400);
      expect(Number(partial.uncovered_quantity)).toBe(400);
    });
  });

  it("refuses a firm commitment that still says availability", async () => {
    await inRollback(async (db) => {
      const { requirementId, lineItemId, oemId } = await seedQuotation(db);
      await expectFailure(
        () =>
          db`
            insert into public.quantity_commitments (oem_id, requirement_id, line_item_id, quantity, firm)
            values (${oemId}, ${requirementId}, ${lineItemId}, 5, true)
          `,
      );
    });
  });

  it("shows global-per-OEM available capacity across live requirements", async () => {
    await inRollback(async (db) => {
      const [oem] = await db<{ id: string }[]>`
        insert into public.oems (name, capacity) values (${"OEM-CAP-" + crypto.randomUUID()}, 1000) returning id
      `;
      const [req] = await db<{ id: string }[]>`
        insert into public.requirements (project_name, customer_agency)
        values ('Capacity requirement', 'Test agency') returning id
      `;
      await db`
        insert into public.quantity_commitments (oem_id, requirement_id, quantity, firm, source)
        values (${oem.id}, ${req.id}, 700, true, 'written_confirmation')
      `;

      const [cap] = await db<{ capacity: string; committed_quantity: string; available_quantity: string }[]>`
        select capacity, committed_quantity, available_quantity
        from public.v_oem_capacity where oem_id = ${oem.id}
      `;
      expect(Number(cap.capacity)).toBe(1000);
      expect(Number(cap.committed_quantity)).toBe(700);
      expect(Number(cap.available_quantity)).toBe(300);
    });
  });
});

describe("hard database gates", () => {
  it("refuses a PO from a draft quotation and allows one from an approved quotation", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);

      await expectFailure(
        () =>
          db`
            insert into public.purchase_orders
              (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
            values
              (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'Test customer', 10, 100, 1000)
          `,
        /approved quotation/i,
      );

      const po = await approvedPo(db, quotationId, requirementId);
      expect(po.id).toBeTruthy();
    });
  });

  it("refuses an OEM invoice before PDI clearance and allows it after", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);
      const po = await approvedPo(db, quotationId, requirementId);

      await expectFailure(
        () =>
          db`
            insert into public.oem_invoices
              (invoice_number, invoice_date, purchase_order_id, quantity_invoiced, gross_amount)
            values (${uniqueInvoiceNumber()}, current_date, ${po.id}, 10, 1000)
          `,
        /cleared PDI/i,
      );

      const [pdi] = await db<{ id: string }[]>`
        insert into public.pdis (purchase_order_id, result, quantity_offered, quantity_cleared)
        values (${po.id}, 'cleared', 10, 10) returning id
      `;
      const [inv] = await db<{ id: string }[]>`
        insert into public.oem_invoices
          (invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, gross_amount)
        values (${uniqueInvoiceNumber()}, current_date, ${po.id}, ${pdi.id}, 10, 1000) returning id
      `;
      expect(inv.id).toBeTruthy();
    });
  });

  it("refuses a commission invoice before the OEM invoice is paid and allows it after", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);
      const po = await approvedPo(db, quotationId, requirementId);
      const [pdi] = await db<{ id: string }[]>`
        insert into public.pdis (purchase_order_id, result, quantity_offered, quantity_cleared)
        values (${po.id}, 'cleared', 10, 10) returning id
      `;
      const [inv] = await db<{ id: string }[]>`
        insert into public.oem_invoices
          (invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, gross_amount, status)
        values (${uniqueInvoiceNumber()}, current_date, ${po.id}, ${pdi.id}, 10, 1000, 'submitted') returning id
      `;

      await expectFailure(
        () =>
          db`
            insert into public.commission_invoices
              (commission_invoice_number, oem_invoice_id, commission_percentage, base_invoice_amount, commission_amount)
            values (${"CI-" + crypto.randomUUID()}, ${inv.id}, 5, 1000, 50)
          `,
        /after the OEM invoice has been paid/i,
      );

      await db`
        insert into public.payments (oem_invoice_id, amount_received, payment_date, invoice_amount, balance_outstanding)
        values (${inv.id}, 1000, current_date, 1000, 0)
      `;
      const [ci] = await db<{ id: string }[]>`
        insert into public.commission_invoices
          (commission_invoice_number, oem_invoice_id, commission_percentage, base_invoice_amount, commission_amount)
        values (${"CI-" + crypto.randomUUID()}, ${inv.id}, 5, 1000, 50) returning id
      `;
      expect(ci.id).toBeTruthy();
    });
  });

  it("refuses a quotation marked approved without both approval levels", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);

      // One level only: still not enough.
      await db`
        insert into public.approvals (stage, entity_type, entity_id, level, decision, decided_at)
        values ('quotation_submitted', 'quotation', ${quotationId}, 'group_head', 'approved', now())
      `;
      await expectFailure(
        () => db`update public.quotations set status = 'approved' where id = ${quotationId}`,
        /Group Head approval followed by a Management approval/i,
      );

      // Direct insert bypass is closed too.
      await expectFailure(
        () => db`insert into public.quotations (requirement_id, status) values (${requirementId}, 'approved')`,
        /cannot be marked approved/i,
      );

      // The reviewed import path may load historical outcomes.
      const [importRequirement] = await db<{ id: string }[]>`
        insert into public.requirements (project_name, customer_agency)
        values ('Imported requirement', 'Test agency') returning id
      `;
      await db.unsafe("set local app.import_mode = 'on'");
      const [imported] = await db<{ id: string }[]>`
        insert into public.quotations (requirement_id, status) values (${importRequirement.id}, 'won') returning id
      `;
      expect(imported.id).toBeTruthy();
    });
  });
});
