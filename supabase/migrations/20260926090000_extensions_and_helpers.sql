-- Inverbrass Defence CRM — shared helpers.
-- gen_random_uuid() is native from Postgres 13 (Supabase runs 17), so no extension is required.

-- Keep updated_at honest on every table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
