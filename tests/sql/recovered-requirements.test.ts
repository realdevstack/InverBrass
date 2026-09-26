import { describe, expect, it } from "vitest";

import {
  approveQuotation,
  asUser,
  createUser,
  expectFailure,
  inRollback,
  seedQuotation,
  uniqueInvoiceNumber,
  uniquePoNumber,
} from "./helpers";

describe("automatic numbering (Input Sheet: RFI and quotation numbers)", () => {
  it("assigns an RFI/YYYY/NNNN number on insert", async () => {
    await inRollback(async (db) => {
      const [row] = await db<{ rfi_number: string }[]>`
        insert into public.requirements (project_name, customer_agency)
        values ('Numbered RFI', 'HAL')
        returning rfi_number
      `;
      expect(row.rfi_number).toMatch(/^RFI\/\d{4}\/\d{4,}$/);
    });
  });

  it("assigns a QTN/YYYY/NNNN number to quotations, including imported ones", async () => {
    await inRollback(async (db) => {
      const { quotationId } = await seedQuotation(db);
      const [row] = await db<{ quotation_number: string }[]>`
        select quotation_number from public.quotations where id = ${quotationId}
      `;
      expect(row.quotation_number).toMatch(/^QTN\/\d{4}\/\d{4,}$/);
    });
  });

  it("accepts the recovered document types", async () => {
    await inRollback(async (db) => {
      const rows = await db<{ value: string }[]>`select unnest(enum_range(null::public.document_type))::text as value`;
      const values = rows.map((r) => r.value);
      expect(values).toContain("rfq");
      expect(values).toContain("quotation");
      expect(values).toContain("commission_invoice");
    });
  });
});

describe("master data (Master Data Inputs: Customer and Product masters)", () => {
  it("lets sales read the customer master but not finance write products", async () => {
    await inRollback(async (db) => {
      await db`insert into public.customers (name) values ('Test Customer')`;
      const sales = await createUser(db, "sales");
      const finance = await createUser(db, "finance");

      await asUser(db, sales, async () => {
        const rows = await db`select id from public.customers where name = 'Test Customer'`;
        expect(rows.length).toBeGreaterThan(0);
      });

      await asUser(db, finance, async () => {
        await expectFailure(
          () => db`insert into public.products (part_number) values ('PN-FIN-1')`,
          /row-level security/i,
        );
      });
    });
  });

  it("records client and OEM part numbers on a line item", async () => {
    await inRollback(async (db) => {
      const { requirementId } = await seedQuotation(db);
      const [line] = await db<{ client_part_number: string }[]>`
        insert into public.line_items (requirement_id, line_no, part_number, client_part_number, quantity)
        values (${requirementId}, 9, 'PN-OEM-9', 'PN-CLIENT-9', 5)
        returning client_part_number
      `;
      expect(line.client_part_number).toBe("PN-CLIENT-9");
    });
  });
});

describe("auto-generated stage references (Input Sheet IDs)", () => {
  it("assigns MR/PDI/DLV numbers on insert", async () => {
    await inRollback(async (db) => {
      const { requirementId, quotationId } = await seedQuotation(db);
      await approveQuotation(db, quotationId);
      const [po] = await db<{ id: string }[]>`
        insert into public.purchase_orders
          (po_number, po_date, quotation_id, requirement_id, customer, quantity_ordered, unit_price, po_value)
        values (${uniquePoNumber()}, current_date, ${quotationId}, ${requirementId}, 'Cust', 1, 1, 1)
        returning id
      `;
      const [mr] = await db<{ readiness_number: string }[]>`
        insert into public.material_readiness (purchase_order_id) values (${po.id}) returning readiness_number
      `;
      expect(mr.readiness_number).toMatch(/^MR\/\d{4}\/\d{4,}$/);

      const [pdi] = await db<{ id: string; pdi_number: string }[]>`
        insert into public.pdis (purchase_order_id, result, quantity_offered, quantity_cleared)
        values (${po.id}, 'cleared', 1, 1) returning id, pdi_number
      `;
      expect(pdi.pdi_number).toMatch(/^PDI\/\d{4}\/\d{4,}$/);

      const [invoice] = await db<{ id: string }[]>`
        insert into public.oem_invoices
          (invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, net_amount, gross_amount)
        values (${uniqueInvoiceNumber()}, current_date, ${po.id}, ${pdi.id}, 1, 100, 118)
        returning id
      `;
      const [delivery] = await db<{ delivery_number: string }[]>`
        insert into public.deliveries (oem_invoice_id, quantity_delivered) values (${invoice.id}, 1) returning delivery_number
      `;
      expect(delivery.delivery_number).toMatch(/^DLV\/\d{4}\/\d{4,}$/);
    });
  });
});

describe("dashboard KPI and report views (Dashboard requirements tab)", () => {
  it("all resolve without error", async () => {
    await inRollback(async (db) => {
      const views = [
        "v_quotation_turnaround",
        "v_delivery_adherence",
        "v_payment_collection",
        "v_commission_recovery",
        "v_oem_performance",
        "v_employee_performance",
        "v_client_repeat",
        "v_product_sales",
        "v_yearly_sales",
        "v_pending_quotations",
        "v_po_tracking",
        "v_delivery_status",
        "v_pdi_status",
        "v_followup_tracker",
        "v_commission_receivable",
        "v_margin_report",
        "v_tax_summary",
        "v_profitability",
      ];
      for (const view of views) {
        await db.unsafe(`select * from public.${view} limit 1`);
      }
      expect(views.length).toBeGreaterThan(0);
    });
  });
});
