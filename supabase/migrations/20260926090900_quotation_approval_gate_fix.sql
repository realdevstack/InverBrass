-- Close the insert path on the quotation approval gate.
--
-- The first version enforced approvals only for UPDATE, so a quotation could be
-- INSERTed already 'approved' or 'won'. This redefinition enforces the gate for
-- both INSERT and UPDATE. The reviewed one-off historical import is the single
-- exception: it runs with `set local app.import_mode = 'on'` so pre-existing
-- outcomes can be loaded without inventing approval rows.

create or replace function public.enforce_quotation_status_approvals()
returns trigger
language plpgsql
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

drop trigger if exists quotations_enforce_approvals on public.quotations;

create trigger quotations_enforce_approvals
  before insert or update on public.quotations
  for each row execute function public.enforce_quotation_status_approvals();
