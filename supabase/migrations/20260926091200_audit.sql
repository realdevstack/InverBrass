-- Database-level audit trail: what changed, who changed it, when.
--
-- Written by triggers, not by the app, so changes made through any path
-- (Server Action, SQL, another service) are recorded. audit_log has no INSERT
-- policy; this SECURITY DEFINER function writes it as the table owner.

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_record_id uuid;
  v_changed text[];
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'DELETE' then
    v_record_id := (to_jsonb(old) ->> 'id')::uuid;
    v_old := to_jsonb(old);
    v_new := null;
    v_changed := array(select jsonb_object_keys(v_old));
  elsif tg_op = 'INSERT' then
    v_record_id := (to_jsonb(new) ->> 'id')::uuid;
    v_old := null;
    v_new := to_jsonb(new);
    v_changed := array(select jsonb_object_keys(v_new));
  else
    v_record_id := (to_jsonb(new) ->> 'id')::uuid;
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_changed := array(
      select k from jsonb_object_keys(v_new) as t(k)
      where v_new -> k is distinct from v_old -> k
    );
  end if;

  insert into public.audit_log (table_name, record_id, action, actor_id, changed_fields, old_values, new_values)
  values (tg_table_name, v_record_id, lower(tg_op)::public.audit_action, v_actor, v_changed, v_old, v_new);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
  audited text[] := array[
    'requirements', 'line_items', 'oems', 'oem_contacts', 'oem_certifications',
    'sourcing_requests', 'sourcing_responses', 'quantity_commitments',
    'quotations', 'purchase_orders', 'material_readiness', 'pdis', 'deliveries',
    'oem_invoices', 'payments', 'commission_invoices', 'documents', 'approvals',
    'user_roles'
  ];
begin
  foreach t in array audited loop
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_trigger()',
      t, t
    );
  end loop;
end;
$$;
