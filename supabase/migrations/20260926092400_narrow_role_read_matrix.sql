-- Narrow the read matrix so each role has a visibly distinct surface. The broad
-- "sales/operations can read everything except finance" matrix made the menus
-- look identical. Reads now follow the PRD's role descriptions: Sales owns the
-- RFI → sourcing → quotation path, Operations owns order → fulfilment, Finance
-- owns order → finance (it needs the PO behind an invoice).
--
-- Privileged roles (owner/group_head/management) keep full access. Writes are
-- unchanged.

create or replace function public.role_can_read(p_area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with access(role, areas) as (
    values
      ('owner',      array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','admin']),
      ('group_head', array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','admin']),
      ('management', array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','admin']),
      ('sales',      array['requirements','oem','sourcing','quotation','documents']),
      ('operations', array['requirements','oem','order','fulfilment','documents']),
      ('finance',    array['requirements','oem','order','finance','documents'])
  )
  select coalesce((select p_area = any(areas) from access where role = public.auth_role()::text), false);
$$;

grant execute on function public.role_can_read(text) to authenticated;
