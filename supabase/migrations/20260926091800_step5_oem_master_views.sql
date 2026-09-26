-- Step 5 — OEM master read models. The tables already exist; these views give
-- the directory and the certification-expiry screen one query each. Days are
-- computed against the current date; IST presentation stays in the app.

create view public.v_oem_directory
with (security_invoker = true) as
select
  o.id as oem_id,
  o.name,
  o.brand_product_category,
  o.country_of_origin,
  o.lead_time_days,
  o.commission_percentage,
  o.capacity,
  o.govt_vendor_list_status,
  o.govt_vendor_list_source,
  o.is_active,
  coalesce(ct.contact_count, 0) as contact_count,
  coalesce(cert.certification_count, 0) as certification_count,
  cert.next_expiry_date,
  coalesce(committed.committed_quantity, 0) as committed_quantity,
  case
    when o.capacity is null then null
    else greatest(o.capacity - coalesce(committed.committed_quantity, 0), 0)
  end as available_quantity
from public.oems o
left join lateral (
  select count(*) as contact_count
  from public.oem_contacts c
  where c.oem_id = o.id
) ct on true
left join lateral (
  select count(*) as certification_count, min(c.expiry_date) as next_expiry_date
  from public.oem_certifications c
  where c.oem_id = o.id
) cert on true
left join lateral (
  select sum(qc.quantity) as committed_quantity
  from public.quantity_commitments qc
  join public.requirements r on r.id = qc.requirement_id
  where qc.oem_id = o.id
    and qc.firm
    and r.status not in ('lost', 'cancelled')
) committed on true;

create view public.v_oem_certification_expiry
with (security_invoker = true) as
select
  c.id as certification_id,
  c.oem_id,
  o.name as oem_name,
  c.certification_type,
  c.reference_number,
  c.issued_by,
  c.issue_date,
  c.expiry_date,
  c.reminder_days,
  case when c.expiry_date is null then null else (c.expiry_date - current_date) end as days_remaining,
  case
    when c.expiry_date is null then 'no_expiry'
    when c.expiry_date < current_date then 'expired'
    when (c.expiry_date - current_date) <= c.reminder_days then 'due_soon'
    else 'valid'
  end as expiry_state
from public.oem_certifications c
join public.oems o on o.id = c.oem_id;
