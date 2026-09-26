-- Step 8 — quotation approval state and the past-bid searchable view.

create view public.v_quotation_approvals
with (security_invoker = true) as
select
  q.id as quotation_id,
  coalesce(a.group_head_approved, 0) as group_head_approved,
  coalesce(a.management_approved, 0) as management_approved,
  (coalesce(a.group_head_approved, 0) > 0 and coalesce(a.management_approved, 0) > 0) as fully_approved
from public.quotations q
left join lateral (
  select
    count(*) filter (where ap.level = 'group_head' and ap.decision = 'approved') as group_head_approved,
    count(*) filter (where ap.level = 'management' and ap.decision = 'approved') as management_approved
  from public.approvals ap
  where ap.entity_type = 'quotation'
    and ap.entity_id = q.id
    and ap.stage = 'quotation_submitted'
) a on true;

-- Past-bid intelligence: filter by part_number, customer_agency or product_type.
create view public.v_past_bids
with (security_invoker = true) as
select
  q.id as quotation_id,
  q.requirement_id,
  r.project_name,
  r.customer_agency,
  q.oem_id,
  o.name as oem_name,
  o.brand_product_category as product_type,
  q.line_item_id,
  li.part_number,
  q.version,
  q.status,
  q.oem_price,
  q.final_price,
  q.loss_reason,
  q.l1_price,
  q.competitor,
  q.submitted_at,
  q.post_submission_status,
  q.pnc_status,
  q.technical_compliance,
  q.commercial_compliance,
  q.created_at
from public.quotations q
join public.requirements r on r.id = q.requirement_id
left join public.oems o on o.id = q.oem_id
left join public.line_items li on li.id = q.line_item_id;
