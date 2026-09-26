-- The list/detail screens need the recovered fields: RFI number, assigned
-- employee (for "my RFIs"), staggered delivery and quotation validity on the
-- requirement; OEM/client part numbers on the line.

drop view if exists public.v_requirement_coverage;

create view public.v_requirement_coverage
with (security_invoker = true) as
select
  r.id as requirement_id,
  r.rfi_number,
  r.project_name,
  r.customer_agency,
  r.status,
  r.pursue_decision,
  r.submission_deadline,
  r.assigned_employee_id,
  r.staggered_delivery,
  r.quotation_validity_days,
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

drop view if exists public.v_line_item_coverage;

create view public.v_line_item_coverage
with (security_invoker = true) as
select
  li.id as line_item_id,
  li.requirement_id,
  li.line_no,
  li.part_number,
  li.client_part_number,
  li.oem_id,
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
