-- Steps 11-13 — finance, document-vault and dashboard read models.

create view public.v_invoice_balances
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
  cm.commission_amount
from public.oem_invoices inv
join public.purchase_orders po on po.id = inv.purchase_order_id
left join public.oems o on o.id = po.oem_id
left join lateral (
  select sum(p.amount_received) as paid_amount, max(p.payment_date) as last_payment_date
  from public.payments p
  where p.oem_invoice_id = inv.id
) pay on true
left join public.commission_invoices cm on cm.oem_invoice_id = inv.id;

create view public.v_document_register
with (security_invoker = true) as
select
  d.id as document_id,
  d.document_type,
  d.title,
  d.supplier,
  d.issue_date,
  d.expiry_date,
  d.renewal_reminder_days,
  d.purchase_order_id,
  po.po_number,
  d.requirement_id,
  r.project_name,
  d.oem_id,
  o.name as oem_name,
  d.file_name,
  d.mime_type,
  d.size_bytes,
  d.created_at,
  case when d.expiry_date is null then null else (d.expiry_date - current_date) end as days_to_expiry
from public.documents d
left join public.purchase_orders po on po.id = d.purchase_order_id
left join public.requirements r on r.id = d.requirement_id
left join public.oems o on o.id = d.oem_id;

-- One row of management KPIs. security_invoker means RLS still scopes the numbers.
create view public.v_dashboard_metrics
with (security_invoker = true) as
select
  (select count(*) from public.requirements) as total_rfis,
  (select count(*) from public.requirements where status in ('received', 'qualifying')) as rfis_open,
  (select count(*) from public.quotations where status in ('draft', 'pending_group_head', 'pending_management', 'approved')) as active_quotations,
  (select count(*) from public.purchase_orders where status in ('open', 'processing')) as open_pos,
  (select count(*) from public.oem_invoices where status <> 'paid' and status <> 'cancelled') as pending_oem_invoices,
  (select count(*) from public.oem_invoices where status <> 'paid' and status <> 'cancelled' and payment_due_date < current_date) as overdue_invoices,
  (select count(*) from public.documents where expiry_date is not null and expiry_date <= current_date + 90) as documents_expiring,
  (select count(*) from public.requirements where status = 'won') as won_requirements,
  (select count(*) from public.requirements where status = 'lost') as lost_requirements,
  (select count(*) from public.requirements where status = 'submitted') as submitted_requirements;

create view public.v_revenue_by_client
with (security_invoker = true) as
select
  po.customer as client,
  count(distinct po.id) as po_count,
  coalesce(sum(po.po_value), 0) as total_value
from public.purchase_orders po
where po.status <> 'cancelled'
group by po.customer;

create view public.v_revenue_by_oem
with (security_invoker = true) as
select
  o.name as oem_name,
  count(distinct po.id) as po_count,
  coalesce(sum(po.po_value), 0) as total_value
from public.purchase_orders po
join public.oems o on o.id = po.oem_id
where po.status <> 'cancelled'
group by o.name;

create view public.v_monthly_sales
with (security_invoker = true) as
select
  to_char(date_trunc('month', po.po_date), 'YYYY-MM') as month,
  count(*) as po_count,
  coalesce(sum(po.po_value), 0) as total_value
from public.purchase_orders po
where po.status <> 'cancelled'
group by date_trunc('month', po.po_date)
order by date_trunc('month', po.po_date);
