import { describe, expect, it } from "vitest";
import type { Sql } from "postgres";

import {
  approveQuotation,
  inRollback,
  seedQuotation,
  uniqueInvoiceNumber,
  uniquePoNumber,
} from "./helpers";

/** An approved quotation advanced to a PO, with a cleared PDI ready to invoice. */
async function poWithClearedPdi(db: Sql, committedDeadlineInDays: number) {
  const { requirementId, quotationId } = await seedQuotation(db);
  await approveQuotation(db, quotationId);
  const [po] = await db<{ id: string }[]>`
    insert into public.purchase_orders
      (po_number, po_date, quotation_id, requirement_id, customer,
       quantity_ordered, unit_price, po_value, taxes_gst, committed_deadline)
    values
      (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'Test customer',
       10, 100, 1000, 180, current_date + ${committedDeadlineInDays}::int)
    returning id
  `;
  const [pdi] = await db<{ id: string }[]>`
    insert into public.pdis (purchase_order_id, result, quantity_offered, quantity_cleared)
    values (${po.id}, 'cleared', 10, 10)
    returning id
  `;
  return { requirementId, quotationId, poId: po.id, pdiId: pdi.id };
}

describe("Step 5 — OEM certification expiry view", () => {
  it("classifies expired, due soon and valid certifications", async () => {
    await inRollback(async (db) => {
      const [oem] = await db<{ id: string }[]>`
        insert into public.oems (name) values (${"OEM-CERT-" + crypto.randomUUID()}) returning id
      `;
      await db`
        insert into public.oem_certifications (oem_id, certification_type, expiry_date, reminder_days)
        values
          (${oem.id}, 'expired-cert', current_date - 1, 90),
          (${oem.id}, 'due-cert', current_date + 10, 90),
          (${oem.id}, 'valid-cert', current_date + 400, 90)
      `;
      const rows = await db<{ certification_type: string; expiry_state: string }[]>`
        select certification_type, expiry_state
        from public.v_oem_certification_expiry
        where oem_id = ${oem.id}
      `;
      const state = Object.fromEntries(rows.map((r) => [r.certification_type, r.expiry_state]));
      expect(state["expired-cert"]).toBe("expired");
      expect(state["due-cert"]).toBe("due_soon");
      expect(state["valid-cert"]).toBe("valid");
    });
  });
});

describe("Step 10 — delivery risk columns and view", () => {
  it("exposes days_to_deadline and stores the extension request", async () => {
    await inRollback(async (db) => {
      const { poId } = await poWithClearedPdi(db, 5);
      const [row] = await db<{ days_to_deadline: number; latest_pdi_result: string }[]>`
        select days_to_deadline, latest_pdi_result from public.v_order_risk where purchase_order_id = ${poId}
      `;
      expect(Number(row.days_to_deadline)).toBe(5);
      expect(row.latest_pdi_result).toBe("cleared");

      await db`
        update public.purchase_orders
        set extension_requested_at = now(), extension_note = 'Production slipped'
        where id = ${poId}
      `;
      const [after] = await db<{ extension_note: string }[]>`
        select extension_note from public.v_order_risk where purchase_order_id = ${poId}
      `;
      expect(after.extension_note).toBe("Production slipped");
    });
  });
});

describe("Step 11 — invoice balance from partial payments", () => {
  it("reduces the outstanding balance when a part payment is recorded", async () => {
    await inRollback(async (db) => {
      const { poId, pdiId } = await poWithClearedPdi(db, 20);
      const [inv] = await db<{ id: string }[]>`
        insert into public.oem_invoices
          (invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, gross_amount, status)
        values (${uniqueInvoiceNumber()}, current_date, ${poId}, ${pdiId}, 10, 1000, 'submitted')
        returning id
      `;
      await db`
        insert into public.payments (oem_invoice_id, amount_received, payment_date, invoice_amount)
        values (${inv.id}, 400, current_date, 1000)
      `;
      const [balance] = await db<{ paid_amount: string; balance_outstanding: string }[]>`
        select paid_amount, balance_outstanding from public.v_invoice_balances where oem_invoice_id = ${inv.id}
      `;
      expect(Number(balance.paid_amount)).toBe(400);
      expect(Number(balance.balance_outstanding)).toBe(600);
    });
  });
});

describe("Step 13 — dashboard metrics view", () => {
  it("returns one row with numeric metrics", async () => {
    await inRollback(async (db) => {
      const [row] = await db<{ total_rfis: number; open_pos: number }[]>`
        select total_rfis, open_pos from public.v_dashboard_metrics
      `;
      expect(Number(row.total_rfis)).toBeGreaterThanOrEqual(0);
      expect(Number(row.open_pos)).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Step 8 — past-bid view is searchable by part, agency and product type", () => {
  it("carries the three comparable filters", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId, oemId } = await seedQuotation(db);
      await db`
        insert into public.quotations (requirement_id, oem_id, version, status, loss_reason)
        values (${requirementId}, ${oemId}, 2, 'lost', 'price')
      `;
      const rows = await db<{ part_number: string | null; customer_agency: string | null; product_type: string | null }[]>`
        select part_number, customer_agency, product_type
        from public.v_past_bids
        where quotation_id = ${quotationId}
      `;
      expect(rows).toHaveLength(1);
      expect(rows[0].part_number).toBe("PN-TEST-1");
      expect(rows[0].customer_agency).toBe("Test agency");
    });
  });
});
