-- The hard-rule functions read other tables (approvals, pdis, payments,
-- quotations) to decide whether an action is allowed. Run as the caller, RLS
-- would hide those rows from a restricted role and the rule would silently pass
-- or fail for the wrong reason — e.g. a Finance user raising an invoice could
-- not see the PDI. They now run as the owner (SECURITY DEFINER) with a fixed
-- search_path, so the rule sees the true state.

create or replace function public.has_two_level_approval(
  p_entity_type text,
  p_entity_id uuid,
  p_stage public.approval_stage
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where level = 'group_head' and decision = 'approved') >= 1
    and count(*) filter (where level = 'management' and decision = 'approved') >= 1
  from public.approvals
  where entity_type = p_entity_type
    and entity_id = p_entity_id
    and stage = p_stage;
$$;

create or replace function public.enforce_quotation_status_approvals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('approved', 'won')
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and coalesce(current_setting('app.import_mode', true), 'off') <> 'on'
     and not public.has_two_level_approval('quotation', new.id, 'quotation_submitted')
  then
    raise exception
      'Quotation % cannot be marked % without a Group Head approval followed by a Management approval',
      new.id, new.status
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_po_quotation_approved()
returns trigger
language plpgsql
security definer
set search_path = public
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

create or replace function public.enforce_invoice_after_pdi()
returns trigger
language plpgsql
security definer
set search_path = public
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

create or replace function public.enforce_commission_after_payment()
returns trigger
language plpgsql
security definer
set search_path = public
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

create or replace function public.snapshot_quotation_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.quotation_versions (quotation_id, version, snapshot, changed_by, change_note)
  values (new.id, new.version, to_jsonb(new), new.created_by, null)
  on conflict (quotation_id, version)
  do update set snapshot = excluded.snapshot, changed_by = excluded.changed_by;
  return new;
end;
$$;
