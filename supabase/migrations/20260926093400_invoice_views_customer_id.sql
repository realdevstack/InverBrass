-- Follow-up contacts: expose `customer_id` on the two invoice read models.
--
-- The contact lookup matched the invoice's free-text `customer` against
-- `customers.name`, so a renamed master (or a name variant typed on the PO)
-- silently dropped the customer's contact. `purchase_orders.customer_id` is the
-- authoritative link; it is appended here (never reordered) so `CREATE OR
-- REPLACE VIEW` keeps the existing columns and grants intact.

create or replace view public.v_invoice_balances
with (security_invoker = true) as
select
  inv.id as oem_invoice_id,
  inv.invoice_number,
  inv.invoice_date,
  inv.status,
  inv.purchase_order_id,
  po.po_number,
  po.customer,
  po.oem_id,
  o.name as oem_name,
  inv.quantity_invoiced,
  inv.is_full_invoice,
  inv.net_amount,
  inv.gst_amount,
  inv.gross_amount,
  inv.payment_due_date,
  coalesce(pay.paid_amount, 0) as paid_amount,
  greatest(inv.gross_amount - coalesce(pay.paid_amount, 0), 0) as balance_outstanding,
  case when inv.payment_due_date is null then null else (inv.payment_due_date - current_date) end as due_in_days,
  pay.last_payment_date,
  cm.id as commission_invoice_id,
  cm.commission_invoice_number,
  cm.commission_amount,
  po.customer_id as customer_id
from public.oem_invoices inv
join public.purchase_orders po on po.id = inv.purchase_order_id
left join public.oems o on o.id = po.oem_id
left join lateral (
  select sum(p.amount_received) as paid_amount, max(p.payment_date) as last_payment_date
  from public.payments p
  where p.oem_invoice_id = inv.id
) pay on true
left join public.commission_invoices cm on cm.oem_invoice_id = inv.id;

create or replace view public.v_followup_tracker
with (security_invoker = true) as
select
  i.id as oem_invoice_id,
  i.invoice_number,
  po.customer,
  i.payment_due_date,
  i.status,
  coalesce(pay.paid, 0) as paid_amount,
  greatest(i.gross_amount - coalesce(pay.paid, 0), 0) as balance_outstanding,
  case when i.payment_due_date is null then null else (current_date - i.payment_due_date) end as overdue_days,
  coalesce(pay.latest_followup, 'none') as followup_status,
  po.customer_id as customer_id
from public.oem_invoices i
join public.purchase_orders po on po.id = i.purchase_order_id
left join lateral (
  select
    sum(p.amount_received) as paid,
    (array_agg(p.followup_status::text order by p.payment_date desc))[1] as latest_followup
  from public.payments p
  where p.oem_invoice_id = i.id
) pay on true
where i.status <> 'cancelled' and greatest(i.gross_amount - coalesce(pay.paid, 0), 0) > 0;
