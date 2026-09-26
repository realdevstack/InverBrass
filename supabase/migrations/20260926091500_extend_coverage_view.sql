-- Extend the requirement coverage view with the fields the list and detail
-- screens need. Only the view changes: the stored commitment rows are untouched,
-- which is the point of keeping the capacity model reversible.

drop view if exists public.v_requirement_coverage;

create view public.v_requirement_coverage
with (security_invoker = true) as
select
  r.id as requirement_id,
  r.project_name,
  r.customer_agency,
  r.status,
  r.pursue_decision,
  r.submission_deadline,
  coalesce(items.required_quantity, 0) as required_quantity,
  coalesce(commits.firm_committed, 0) as firm_committed,
  coalesce(commits.indicated_available, 0) as indicated_available,
  greatest(coalesce(items.required_quantity, 0) - coalesce(commits.firm_committed, 0), 0) as uncovered_quantity
from public.requirements r
left join lateral (
  select sum(li.quantity) as required_quantity
  from public.line_items li
  where li.requirement_id = r.id
) items on true
left join lateral (
  select
    sum(qc.quantity) filter (where qc.firm) as firm_committed,
    sum(qc.quantity) filter (where not qc.firm) as indicated_available
  from public.quantity_commitments qc
  where qc.requirement_id = r.id
) commits on true;
