-- Read-only schema overview for the internal /schema page: table names and row
-- counts only, never row data. Restricted to signed-in users.

create or replace function public.schema_overview()
returns table (table_name text, row_count bigint)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  r record;
  cnt bigint;
begin
  for r in
    select c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  loop
    execute format('select count(*) from public.%I', r.name) into cnt;
    table_name := r.name;
    row_count := cnt;
    return next;
  end loop;
end;
$$;

revoke all on function public.schema_overview() from public, anon;
grant execute on function public.schema_overview() to authenticated;
