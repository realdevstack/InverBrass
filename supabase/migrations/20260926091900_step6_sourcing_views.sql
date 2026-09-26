-- Step 6 — sourcing ledger and commitment read models.

create view public.v_sourcing_ledger
with (security_invoker = true) as
select
  sr.id as sourcing_request_id,
  sr.requirement_id,
  r.project_name,
  sr.oem_id,
  o.name as oem_name,
  sr.line_item_id,
  li.part_number,
  sr.channel,
  sr.subject,
  sr.message,
  sr.sent_at,
  resp.response_count,
  resp.latest_response_type,
  resp.latest_response_at,
  resp.latest_quoted_unit_price
from public.sourcing_requests sr
join public.requirements r on r.id = sr.requirement_id
join public.oems o on o.id = sr.oem_id
left join public.line_items li on li.id = sr.line_item_id
left join lateral (
  select
    count(*) as response_count,
    (array_agg(sres.response_type order by sres.received_at desc))[1] as latest_response_type,
    max(sres.received_at) as latest_response_at,
    (array_agg(sres.quoted_unit_price order by sres.received_at desc))[1] as latest_quoted_unit_price
  from public.sourcing_responses sres
  where sres.sourcing_request_id = sr.id
) resp on true;

create view public.v_commitment_detail
with (security_invoker = true) as
select
  qc.id as commitment_id,
  qc.oem_id,
  o.name as oem_name,
  qc.requirement_id,
  r.project_name,
  qc.line_item_id,
  li.part_number,
  qc.quantity,
  qc.firm,
  qc.source,
  qc.notes,
  qc.created_at,
  qc.updated_at
from public.quantity_commitments qc
join public.oems o on o.id = qc.oem_id
join public.requirements r on r.id = qc.requirement_id
left join public.line_items li on li.id = qc.line_item_id;
