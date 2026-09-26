import { z } from "zod";

import { checkbox, optionalDate, optionalNumber, optionalText, optionalUuid, requiredNumber, requiredText } from "@/lib/validation/common";

export const invoiceSchema = z.object({
  purchase_order_id: z.string().uuid(),
  pdi_id: z.string().uuid("Choose a cleared PDI"),
  invoice_number: requiredText("Invoice number is required", 100),
  invoice_date: z.string().trim().min(1, "Invoice date is required"),
  quantity_invoiced: requiredNumber({ min: 0.001 }),
  is_full_invoice: checkbox(),
  balance_quantity: optionalNumber({ min: 0 }),
  net_amount: requiredNumber({ min: 0 }),
  gst_amount: optionalNumber({ min: 0 }),
  gross_amount: requiredNumber({ min: 0 }),
  dispatch_date: optionalDate(),
  courier_details: optionalText(200),
  lr_awb_number: optionalText(100),
  e_way_bill_number: optionalText(100),
  documents_submitted: optionalText(500),
  payment_due_date: optionalDate(),
});

export const paymentSchema = z.object({
  oem_invoice_id: z.string().uuid(),
  payment_reference: optionalText(120),
  customer: optionalText(200),
  oem_id: optionalUuid(),
  invoice_amount: requiredNumber({ min: 0 }),
  amount_received: requiredNumber({ min: 0.01 }),
  payment_date: z.string().trim().min(1, "Payment date is required"),
  terms: optionalText(200),
  mode: z.enum(["rtgs", "neft", "wire", "other"]),
  followup_status: z.enum(["none", "reminded", "escalated", "resolved"]),
  remarks: optionalText(500),
});

export const deliverySchema = z.object({
  oem_invoice_id: z.string().uuid(),
  delivery_reference: optionalText(120),
  delivery_date: optionalDate(),
  location: optionalText(200),
  quantity_delivered: requiredNumber({ min: 0.001 }),
  delivery_status: z.enum(["in_transit", "delivered", "partially_delivered", "cancelled"]),
  material_acceptance_status: z.enum(["pending", "accepted", "partially_accepted", "rejected"]),
  closure_status: z.enum(["pending", "closed"]),
  grn_number: optionalText(100),
  remarks: optionalText(500),
});

export const commissionSchema = z.object({
  oem_invoice_id: z.string().uuid(),
  commission_invoice_number: requiredText("Commission invoice number is required", 100),
  oem_id: optionalUuid(),
  customer_name: optionalText(200),
  commission_percentage: requiredNumber({ min: 0, max: 100 }),
  base_invoice_amount: requiredNumber({ min: 0 }),
  commission_amount: optionalNumber({ min: 0 }),
  gst_amount: optionalNumber({ min: 0 }),
  tds_amount: optionalNumber({ min: 0 }),
  payment_status: z.enum(["draft", "raised", "submitted", "partially_paid", "paid", "overdue"]),
  outstanding_amount: optionalNumber({ min: 0 }),
  invoice_date: optionalDate(),
  payment_due_date: optionalDate(),
  remarks: optionalText(500),
});
