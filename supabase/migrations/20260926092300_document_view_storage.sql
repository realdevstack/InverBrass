-- The document register needs the storage location so the list can mint signed
-- URLs. Recreate the view with the storage columns included.

drop view if exists public.v_document_register;

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
  d.storage_bucket,
  d.storage_path,
  d.file_name,
  d.mime_type,
  d.size_bytes,
  d.created_at,
  case when d.expiry_date is null then null else (d.expiry_date - current_date) end as days_to_expiry
from public.documents d
left join public.purchase_orders po on po.id = d.purchase_order_id
left join public.requirements r on r.id = d.requirement_id
left join public.oems o on o.id = d.oem_id;
