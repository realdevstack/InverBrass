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

/**
 * Business flow logic, end to end:
 *
 *   RFI -> Quotation -> Purchase Order -> OEM Invoice -> Delivery -> Payment -> Commission
 *
 * Each rule from the client's brief is one test below; the gates are database
 * triggers, so the assertions call SQL directly (never the UI) to prove a bypass
 * is impossible.
 */

type Chain = {
  requirementId: string;
  quotationId: string;
  poId: string;
  pdiId: string;
  invoiceId: string;
  quantity: number;
  gross: number;
};

/** A requirement -> approved quotation -> PO -> cleared PDI -> invoice chain. */
async function buildChain(
  db: Sql,
  opts: { quantity?: number; gross?: number } = {},
): Promise<Chain> {
  const quantity = opts.quantity ?? 10;
  const gross = opts.gross ?? 1000;
  const { requirementId, quotationId } = await seedQuotation(db);
  await approveQuotation(db, quotationId);

  const [po] = await db<{ id: string }[]>`
    insert into public.purchase_orders
      (po_number, po_date, quotation_id, requirement_id, customer,
       quantity_ordered, unit_price, po_value, taxes_gst)
    values
      (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'Flow customer',
       ${quantity}, 100, ${gross}, 0)
    returning id
  `;
  const [pdi] = await db<{ id: string }[]>`
    insert into public.pdis (purchase_order_id, result, quantity_offered, quantity_cleared)
    values (${po.id}, 'cleared', ${quantity}, ${quantity})
    returning id
  `;
  const [invoice] = await db<{ id: string }[]>`
    insert into public.oem_invoices
      (invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, gross_amount, status)
    values (${uniqueInvoiceNumber()}, current_date, ${po.id}, ${pdi.id}, ${quantity}, ${gross}, 'submitted')
    returning id
  `;

  return {
    requirementId,
    quotationId,
    poId: po.id,
    pdiId: pdi.id,
    invoiceId: invoice.id,
    quantity,
    gross,
  };
}

async function addPayment(db: Sql, invoiceId: string, amount: number) {
  const [row] = await db<{ id: string }[]>`
    insert into public.payments (oem_invoice_id, amount_received, payment_date, invoice_amount)
    values (${invoiceId}, ${amount}, current_date, ${amount})
    returning id
  `;
  return row;
}

async function addDelivery(db: Sql, invoiceId: string, quantity: number, pending: number) {
  const [row] = await db<{ id: string }[]>`
    insert into public.deliveries (oem_invoice_id, quantity_delivered, pending_balance)
    values (${invoiceId}, ${quantity}, ${pending})
    returning id
  `;
  return row;
}

describe("Business flow 1 — every quotation originates from an RFI", () => {
  it("refuses a quotation with no requirement, and one pointing at an unknown RFI", async () => {
    await inRollback(async (db) => {
      await expectFailure(
        () => db`insert into public.quotations (status) values ('draft')`,
        /null value/i,
      );
      await expectFailure(
        () =>
          db`insert into public.quotations (requirement_id, status) values (${crypto.randomUUID()}, 'draft')`,
        /foreign key/i,
      );

      // The honest path works: a quotation always carries its requirement.
      const { quotationId, requirementId } = await seedQuotation(db);
      const [row] = await db<{ requirement_id: string }[]>`
        select requirement_id from public.quotations where id = ${quotationId}
      `;
      expect(row.requirement_id).toBe(requirementId);
    });
  });
});

describe("Business flow 2 — every PO maps to an approved quotation", () => {
  it("refuses a PO without an approved quotation, including from a one-level approval", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);

      // Draft quotation: refused.
      await expectFailure(
        () =>
          db`
            insert into public.purchase_orders
              (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
            values (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'C', 1, 1, 1)
          `,
        /approved quotation/i,
      );

      // Group Head only (no Management): still refused.
      await db`
        insert into public.approvals (stage, entity_type, entity_id, level, decision, decided_at)
        values ('quotation_submitted', 'quotation', ${quotationId}, 'group_head', 'approved', now())
      `;
      await expectFailure(
        () =>
          db`
            insert into public.purchase_orders
              (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
            values (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'C', 1, 1, 1)
          `,
        /approved quotation/i,
      );

      // An unknown quotation id is refused too (no orphan PO).
      await expectFailure(
        () =>
          db`
            insert into public.purchase_orders
              (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
            values (${uniquePoNumber()}, current_date, ${crypto.randomUUID()}, ${requirementId}, 'C', 1, 1, 1)
          `,
        /unknown quotation/i,
      );
    });
  });

  it("allows a PO once both approval levels are on record, even after the status moves on", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);
      await approveQuotation(db, quotationId);
      // A won/submitted bid still has its approvals; the PO gate must not require
      // the status to still literally read 'approved'.
      await db`update public.quotations set status = 'submitted' where id = ${quotationId}`;

      const [po] = await db<{ id: string }[]>`
        insert into public.purchase_orders
          (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
        values (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'C', 1, 1, 1)
        returning id
      `;
      expect(po.id).toBeTruthy();
    });
  });
});

describe("Business flow 3 — multiple invoices per PO", () => {
  it("keeps two invoices against one PO", async () => {
    await inRollback(async (db) => {
      const chain = await buildChain(db);
      const [second] = await db<{ id: string }[]>`
        insert into public.oem_invoices
          (invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, gross_amount, status)
        values (${uniqueInvoiceNumber()}, current_date, ${chain.poId}, ${chain.pdiId}, 5, 500, 'submitted')
        returning id
      `;

      const [{ count }] = await db<{ count: string }[]>`
        select count(*) from public.oem_invoices where purchase_order_id = ${chain.poId}
      `;
      expect(Number(count)).toBe(2);
      expect(second.id).toBeTruthy();
    });
  });

  it("still refuses an invoice before PDI clearance", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);
      await approveQuotation(db, quotationId);
      const [po] = await db<{ id: string }[]>`
        insert into public.purchase_orders
          (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
        values (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'C', 1, 1, 1)
        returning id
      `;
      await expectFailure(
        () =>
          db`
            insert into public.oem_invoices
              (invoice_number, invoice_date, purchase_order_id, quantity_invoiced, gross_amount)
            values (${uniqueInvoiceNumber()}, current_date, ${po.id}, 1, 100)
          `,
        /cleared PDI/i,
      );
    });
  });
});

describe("Business flow 4 — multiple deliveries per invoice (partial deliveries)", () => {
  it("accepts two partial deliveries summing to the invoice, and refuses a third", async () => {
    await inRollback(async (db) => {
      const chain = await buildChain(db, { quantity: 10 });
      await addDelivery(db, chain.invoiceId, 4, 6);
      await addDelivery(db, chain.invoiceId, 6, 0);

      const [{ count }] = await db<{ count: string }[]>`
        select count(*) from public.deliveries where oem_invoice_id = ${chain.invoiceId}
      `;
      expect(Number(count)).toBe(2);

      await expectFailure(
        () => addDelivery(db, chain.invoiceId, 1, 0),
        /cannot exceed the invoice balance/i,
      );
    });
  });
});

describe("Business flow 5 — commission only after the OEM payment milestone", () => {
  it("refuses commission on a partial payment and allows it once fully paid", async () => {
    await inRollback(async (db) => {
      const chain = await buildChain(db, { gross: 1000 });

      await addPayment(db, chain.invoiceId, 400);
      await expectFailure(
        () =>
          db`
            insert into public.commission_invoices
              (commission_invoice_number, oem_invoice_id, commission_percentage, base_invoice_amount, commission_amount)
            values (${"CI-" + crypto.randomUUID()}, ${chain.invoiceId}, 5, 1000, 50)
          `,
        /after the OEM invoice has been paid/i,
      );

      await addPayment(db, chain.invoiceId, 600);
      const [ci] = await db<{ id: string }[]>`
        insert into public.commission_invoices
          (commission_invoice_number, oem_invoice_id, commission_percentage, base_invoice_amount, commission_amount)
        values (${"CI-" + crypto.randomUUID()}, ${chain.invoiceId}, 5, 1000, 50)
        returning id
      `;
      expect(ci.id).toBeTruthy();
    });
  });
});

describe("Business flow 6 — partial payments with a visible balance", () => {
  it("tracks the balance down to zero and refuses an over-payment", async () => {
    await inRollback(async (db) => {
      const chain = await buildChain(db, { gross: 1000 });
      await addPayment(db, chain.invoiceId, 400);
      await addPayment(db, chain.invoiceId, 600);

      const [balance] = await db<{ paid_amount: string; balance_outstanding: string }[]>`
        select paid_amount, balance_outstanding
        from public.v_invoice_balances where oem_invoice_id = ${chain.invoiceId}
      `;
      expect(Number(balance.paid_amount)).toBe(1000);
      expect(Number(balance.balance_outstanding)).toBe(0);

      await expectFailure(
        () => addPayment(db, chain.invoiceId, 1),
        /cannot exceed the invoice balance/i,
      );
    });
  });
});

describe("Business flow 7 — complete audit trail", () => {
  it("records an audit row for every stage of the chain", async () => {
    await inRollback(async (db) => {
      const chain = await buildChain(db, { quantity: 10, gross: 1000 });
      const delivery = await addDelivery(db, chain.invoiceId, 10, 0);
      const payment = await addPayment(db, chain.invoiceId, 1000);
      const [commission] = await db<{ id: string }[]>`
        insert into public.commission_invoices
          (commission_invoice_number, oem_invoice_id, commission_percentage, base_invoice_amount, commission_amount)
        values (${"CI-" + crypto.randomUUID()}, ${chain.invoiceId}, 5, 1000, 50)
        returning id
      `;

      const expected: Array<[string, string]> = [
        ["requirements", chain.requirementId],
        ["quotations", chain.quotationId],
        ["purchase_orders", chain.poId],
        ["pdis", chain.pdiId],
        ["oem_invoices", chain.invoiceId],
        ["deliveries", delivery.id],
        ["payments", payment.id],
        ["commission_invoices", commission.id],
      ];

      for (const [table, recordId] of expected) {
        const [row] = await db<{ count: string }[]>`
          select count(*) from public.audit_log
          where table_name = ${table} and record_id = ${recordId} and action = 'insert'
        `;
        expect(Number(row.count), `audit row for ${table}`).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it("records who changed what on an update", async () => {
    await inRollback(async (db) => {
      const chain = await buildChain(db);
      await db`update public.oem_invoices set status = 'approved' where id = ${chain.invoiceId}`;

      const [row] = await db<{ action: string; changed_fields: string[] }[]>`
        select action, changed_fields from public.audit_log
        where table_name = 'oem_invoices' and record_id = ${chain.invoiceId}
        order by id desc limit 1
      `;
      expect(row.action).toBe("update");
      expect(row.changed_fields).toContain("status");
    });
  });
});
