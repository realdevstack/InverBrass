-- Roles and the deny-by-default permission helpers.
--
-- Six roles (resolved contradiction: PRD §3 folds three into one row, the
-- superseded stack says four, TECH-STACK.md says five; the plan enumerates six,
-- so six it is). A user with no active role gets NULL from auth_role(), and every
-- helper then returns false: deny by default.

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row execute function public.set_updated_at();

-- Helpers first: the user_roles policies call auth_role().
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid() and is_active;
$$;

create or replace function public.auth_is_privileged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() in ('owner', 'group_head', 'management'), false);
$$;

-- Area read/write matrix. Anything not listed is denied.
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
      ('sales',      array['requirements','oem','sourcing','quotation','order','fulfilment','documents']),
      ('operations', array['requirements','oem','sourcing','quotation','order','fulfilment','documents']),
      ('finance',    array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents'])
  )
  select coalesce((select p_area = any(areas) from access where role = public.auth_role()::text), false);
$$;

create or replace function public.role_can_write(p_area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with access(role, areas) as (
    values
      ('owner',      array['requirements','oem','sourcing','quotation','order','fulfilment','finance','documents','admin']),
      ('group_head', array['requirements','oem','sourcing','quotation','order','documents','admin']),
      ('management', array['requirements','oem','sourcing','quotation','order','documents','admin']),
      ('sales',      array['requirements','oem','sourcing','quotation','documents']),
      ('operations', array['order','fulfilment','documents']),
      ('finance',    array['finance','documents'])
  )
  select coalesce((select p_area = any(areas) from access where role = public.auth_role()::text), false);
$$;

grant execute on function public.auth_role() to authenticated;
grant execute on function public.auth_is_privileged() to authenticated;
grant execute on function public.role_can_read(text) to authenticated;
grant execute on function public.role_can_write(text) to authenticated;

alter table public.user_roles enable row level security;

-- A user may read their own role; Owner manages the table.
create policy user_roles_select_self on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.auth_role() = 'owner');

create policy user_roles_owner_write on public.user_roles
  for all to authenticated
  using (public.auth_role() = 'owner')
  with check (public.auth_role() = 'owner');
