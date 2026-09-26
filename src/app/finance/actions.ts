"use server";

import { revalidatePath } from "next/cache";

import { commissionBreakdown } from "@/lib/rules/quotation";
import { createClient } from "@/lib/supabase/server";
import {
  commissionSchema,
  deliverySchema,
  invoiceSchema,
  paymentSchema,
} from "@/lib/validation/finance";

export type FinanceFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

function fieldErrorsFrom(issues: Array<{ path: readonly PropertyKey[]; message: string }>) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function createInvoiceAction(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: created, error } = await supabase
    .from("oem_invoices")
    .insert({
      invoice_number: input.invoice_number,
      invoice_date: input.invoice_date,
      purchase_order_id: input.purchase_order_id,
      pdi_id: input.pdi_id,
      quantity_invoiced: input.quantity_invoiced,
      is_full_invoice: input.is_full_invoice,
      balance_quantity: input.balance_quantity ?? 0,
      net_amount: input.net_amount,
      gst_amount: input.gst_amount ?? 0,
      gross_amount: input.gross_amount,
      dispatch_date: input.dispatch_date,
      courier_details: input.courier_details,
      lr_awb_number: input.lr_awb_number,
      e_way_bill_number: input.e_way_bill_number,
      documents_submitted: input.documents_submitted,
      payment_due_date: input.payment_due_date,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/finance");
  revalidatePath(`/orders/${input.purchase_order_id}`);
  return { ok: true, fieldErrors: { created_id: created.id } };
}

export async function recordPaymentAction(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoice } = await supabase
    .from("oem_invoices")
    .select("id, purchase_order_id, gross_amount, status")
    .eq("id", input.oem_invoice_id)
    .maybeSingle();
  if (!invoice) return { error: "Invoice not found." };

  const { data: priorRows } = await supabase
    .from("payments")
    .select("amount_received")
    .eq("oem_invoice_id", input.oem_invoice_id);
  const priorTotal = (priorRows ?? []).reduce((sum, row) => sum + Number(row.amount_received), 0);
  const gross = Number(invoice.gross_amount);
  const newTotal = round2(priorTotal + input.amount_received);
  const balance = round2(Math.max(gross - newTotal, 0));

  const { error } = await supabase.from("payments").insert({
    oem_invoice_id: input.oem_invoice_id,
    payment_reference: input.payment_reference,
    customer: input.customer,
    oem_id: input.oem_id,
    invoice_amount: input.invoice_amount,
    amount_received: input.amount_received,
    balance_outstanding: balance,
    payment_date: input.payment_date,
    terms: input.terms,
    mode: input.mode,
    followup_status: input.followup_status,
    remarks: input.remarks,
    status: balance === 0 ? "paid" : "partially_paid",
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  // invoice_status has no "partially paid": a part payment leaves it submitted.
  await supabase
    .from("oem_invoices")
    .update({ status: balance === 0 ? "paid" : "submitted" })
    .eq("id", input.oem_invoice_id);

  revalidatePath("/finance");
  revalidatePath(`/finance/${input.oem_invoice_id}`);
  return { ok: true };
}

export async function createCommissionAction(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const parsed = commissionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const computed = commissionBreakdown({
    baseInvoiceAmount: input.base_invoice_amount,
    commissionPercentage: input.commission_percentage,
  });
  // Auto commission calculation: when no amount is entered it is computed from
  // the base invoice value at the agreed percentage.
  const commissionAmount = input.commission_amount ?? computed.commissionAmount;
  const gst = input.gst_amount ?? computed.gstAmount;
  const tds = input.tds_amount ?? computed.tdsAmount;
  const outstanding = input.outstanding_amount ?? round2(commissionAmount + gst - tds);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("commission_invoices").insert({
    commission_invoice_number: input.commission_invoice_number,
    oem_invoice_id: input.oem_invoice_id,
    oem_id: input.oem_id,
    customer_name: input.customer_name,
    commission_percentage: input.commission_percentage,
    base_invoice_amount: input.base_invoice_amount,
    commission_amount: commissionAmount,
    gst_amount: gst,
    tds_amount: tds,
    payment_status: input.payment_status,
    outstanding_amount: outstanding,
    gross_invoice_value: round2(commissionAmount + gst),
    invoice_date: input.invoice_date,
    payment_due_date: input.payment_due_date,
    remarks: input.remarks,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/finance");
  revalidatePath(`/finance/${input.oem_invoice_id}`);
  return { ok: true };
}

export async function recordDeliveryAction(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const parsed = deliverySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoice } = await supabase
    .from("oem_invoices")
    .select("quantity_invoiced")
    .eq("id", input.oem_invoice_id)
    .maybeSingle();
  const { data: priorRows } = await supabase
    .from("deliveries")
    .select("quantity_delivered")
    .eq("oem_invoice_id", input.oem_invoice_id);
  const priorTotal = (priorRows ?? []).reduce((sum, row) => sum + Number(row.quantity_delivered), 0);
  const invoiced = invoice ? Number(invoice.quantity_invoiced) : 0;
  const pending = round2(Math.max(invoiced - (priorTotal + input.quantity_delivered), 0));

  const { error } = await supabase.from("deliveries").insert({
    oem_invoice_id: input.oem_invoice_id,
    delivery_reference: input.delivery_reference,
    delivery_date: input.delivery_date,
    location: input.location,
    quantity_delivered: input.quantity_delivered,
    pending_balance: pending,
    delivery_status: input.delivery_status,
    material_acceptance_status: input.material_acceptance_status,
    closure_status: input.closure_status,
    grn_number: input.grn_number,
    remarks: input.remarks,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/finance/${input.oem_invoice_id}`);
  revalidatePath("/finance");
  return { ok: true };
}
