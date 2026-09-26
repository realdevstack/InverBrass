-- Add the line-item display fields to the per-line coverage view so the detail
-- screen needs one query, not a view plus a join.

drop view if exists public.v_line_item_coverage;

create view public.v_line_item_coverage
with (security_invoker = true) as
select
  li.id as line_item_id,
  li.requirement_id,
  li.line_no,
  li.part_number,
  li.description,
  li.uom,
  li.required_delivery_date,
  li.quantity as required_quantity,
  coalesce(c.firm_committed, 0) as firm_committed,
  coalesce(c.indicated_available, 0) as indicated_available,
  greatest(li.quantity - coalesce(c.firm_committed, 0), 0) as uncovered_quantity
from public.line_items li
left join lateral (
  select
    sum(qc.quantity) filter (where qc.firm) as firm_committed,
    sum(qc.quantity) filter (where not qc.firm) as indicated_available
  from public.quantity_commitments qc
  where qc.line_item_id = li.id
) c on true;
