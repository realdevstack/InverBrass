-- Coverage views and the hard database rules.
--
-- The coverage maths is deliberately a view over quantity_commitments: if the
-- client later confirms per-order capacity instead of global-per-OEM, only the
-- view changes, never the stored rows.

-- Deferred foreign keys (the referenced tables are created earlier now).
alter table public.sourcing_responses
  add constraint sourcing_responses_attachment_document_fk
  foreign key (attachment_document_id) references public.documents (id) on delete set null;

alter table public.purchase_orders
  add constraint purchase_orders_po_copy_document_fk
  foreign key (po_copy_document_id) references public.documents (id) on delete set null;

-- Per-line coverage. Only firm commitments count toward the uncovered balance.
create view public.v_line_item_coverage
with (security_invoker = true) as
select
  li.id as line_item_id,
  li.requirement_id,
  li.line_no,
  li.part_number,
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

-- Requirement-level coverage. Uses lateral aggregates so line items and
-- commitments never multiply each other in a cartesian join.
create view public.v_requirement_coverage
with (security_invoker = true) as
select
  r.id as requirement_id,
  r.project_name,
  r.status,
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

-- Global-per-OEM capacity: firm commitments across every live requirement.
create view public.v_oem_capacity
with (security_invoker = true) as
select
  o.id as oem_id,
  o.name,
  o.capacity,
  coalesce(c.committed, 0) as committed_quantity,
  case
    when o.capacity is null then null
    else greatest(o.capacity - coalesce(c.committed, 0), 0)
  end as available_quantity
from public.oems o
left join lateral (
  select sum(qc.quantity) as committed
  from public.quantity_commitments qc
  join public.requirements r on r.id = qc.requirement_id
  where qc.oem_id = o.id
    and qc.firm
    and r.status not in ('lost', 'cancelled')
) c on true;

-- Both approval levels recorded, in either insertion order but with both present.
create or replace function public.has_two_level_approval(
  p_entity_type text,
  p_entity_id uuid,
  p_stage public.approval_stage
)
returns boolean
language sql
stable
as $$
  select
    count(*) filter (where level = 'group_head' and decision = 'approved') >= 1
    and count(*) filter (where level = 'management' and decision = 'approved') >= 1
  from public.approvals
  where entity_type = p_entity_type
    and entity_id = p_entity_id
    and stage = p_stage;
$$;

-- A quotation may only reach 'approved' when both approval levels are recorded.
create or replace function public.enforce_quotation_status_approvals()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    if not public.has_two_level_approval('quotation', new.id, 'quotation_submitted') then
      raise exception
        'Quotation % cannot be approved without a Group Head approval followed by a Management approval',
        new.id
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger quotations_enforce_approvals
  before update on public.quotations
  for each row execute function public.enforce_quotation_status_approvals();

-- Keep a snapshot per quotation version.
create or replace function public.snapshot_quotation_version()
returns trigger
language plpgsql
as $$
begin
  insert into public.quotation_versions (quotation_id, version, snapshot, changed_by, change_note)
  values (new.id, new.version, to_jsonb(new), new.created_by, null)
  on conflict (quotation_id, version)
  do update set snapshot = excluded.snapshot, changed_by = excluded.changed_by;
  return new;
end;
$$;

create trigger quotations_snapshot_version
  after insert or update on public.quotations
  for each row execute function public.snapshot_quotation_version();

-- No orphan POs: only an approved quotation can become a PO. Status is advanced
-- by record_approval() (added in the approvals migration) which enforces order.
create or replace function public.enforce_po_quotation_approved()
returns trigger
language plpgsql
as $$
declare
  q_status public.quotation_status;
begin
  select q.status into q_status from public.quotations q where q.id = new.quotation_id;
  if q_status is null then
    raise exception 'PO % references unknown quotation %', new.po_number, new.quotation_id
      using errcode = '23514';
  end if;
  if q_status not in ('approved', 'submitted', 'awaiting_approval', 'won') then
    raise exception
      'PO % can only be created from an approved quotation; quotation % is %',
      new.po_number, new.quotation_id, q_status
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger purchase_orders_require_approved_quotation
  before insert or update of quotation_id on public.purchase_orders
  for each row execute function public.enforce_po_quotation_approved();

-- Invoicing is locked until a PDI is cleared for the same PO.
create or replace function public.enforce_invoice_after_pdi()
returns trigger
language plpgsql
as $$
begin
  if new.pdi_id is null then
    raise exception 'OEM invoice % requires a cleared PDI', new.invoice_number
      using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.pdis p
    where p.id = new.pdi_id
      and p.purchase_order_id = new.purchase_order_id
      and p.result in ('cleared', 'partially_cleared')
  ) then
    raise exception 'OEM invoice % can only be raised after PDI clearance', new.invoice_number
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger oem_invoices_require_pdi_clearance
  before insert or update of pdi_id, purchase_order_id on public.oem_invoices
  for each row execute function public.enforce_invoice_after_pdi();

-- Commission only after the OEM invoice has been paid.
create or replace function public.enforce_commission_after_payment()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.oem_invoices inv
    where inv.id = new.oem_invoice_id
      and (
        inv.status = 'paid'
        or (select coalesce(sum(p.amount_received), 0)
              from public.payments p
             where p.oem_invoice_id = inv.id) >= inv.gross_amount
      )
  ) then
    raise exception
      'Commission invoice % can only be raised after the OEM invoice has been paid',
      new.commission_invoice_number
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger commission_invoices_require_payment
  before insert or update of oem_invoice_id on public.commission_invoices
  for each row execute function public.enforce_commission_after_payment();
