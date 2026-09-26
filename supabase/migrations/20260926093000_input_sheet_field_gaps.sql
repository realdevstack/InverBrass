-- Remaining "Input Sheet" fields the PRD omitted, plus the auto-generated
-- references the sheet asks for (Material Readiness ID, PDI ID, Delivery
-- Reference). Same trigger pattern as the RFI/quotation numbering.

-- RFI: associated OEM and free-text remarks.
alter table public.requirements
  add column if not exists primary_oem_id uuid references public.oems (id) on delete set null,
  add column if not exists remarks text;

-- Quotation: the OEM's own quotation number, quotation date, unit price and quoted quantity.
alter table public.quotations
  add column if not exists oem_quotation_number text,
  add column if not exists quotation_date date,
  add column if not exists unit_price numeric(14, 2) check (unit_price is null or unit_price >= 0),
  add column if not exists quantity numeric(14, 3) check (quantity is null or quantity >= 0);

-- Commission: internal remarks.
alter table public.commission_invoices
  add column if not exists remarks text;

-- Auto-generated references for the three stage records.
create sequence if not exists public.readiness_number_seq;
create sequence if not exists public.pdi_number_seq;
create sequence if not exists public.delivery_number_seq;

alter table public.material_readiness add column if not exists readiness_number text;
alter table public.pdis add column if not exists pdi_number text;
alter table public.deliveries add column if not exists delivery_number text;

with ordered as (
  select id, row_number() over (order by created_at, id) as rn, created_at
  from public.material_readiness where readiness_number is null
)
update public.material_readiness m
set readiness_number = 'MR/' || to_char(o.created_at, 'YYYY') || '/' || lpad(o.rn::text, 4, '0')
from ordered o where o.id = m.id;

with ordered as (
  select id, row_number() over (order by created_at, id) as rn, created_at
  from public.pdis where pdi_number is null
)
update public.pdis p
set pdi_number = 'PDI/' || to_char(o.created_at, 'YYYY') || '/' || lpad(o.rn::text, 4, '0')
from ordered o where o.id = p.id;

with ordered as (
  select id, row_number() over (order by created_at, id) as rn, created_at
  from public.deliveries where delivery_number is null
)
update public.deliveries d
set delivery_number = 'DLV/' || to_char(o.created_at, 'YYYY') || '/' || lpad(o.rn::text, 4, '0')
from ordered o where o.id = d.id;

select setval('public.readiness_number_seq', greatest((select count(*) from public.material_readiness), 1));
select setval('public.pdi_number_seq', greatest((select count(*) from public.pdis), 1));
select setval('public.delivery_number_seq', greatest((select count(*) from public.deliveries), 1));

create or replace function public.set_readiness_number()
returns trigger language plpgsql as $$
begin
  if new.readiness_number is null then
    new.readiness_number := 'MR/' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/'
      || lpad(nextval('public.readiness_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_pdi_number()
returns trigger language plpgsql as $$
begin
  if new.pdi_number is null then
    new.pdi_number := 'PDI/' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/'
      || lpad(nextval('public.pdi_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_delivery_number()
returns trigger language plpgsql as $$
begin
  if new.delivery_number is null then
    new.delivery_number := 'DLV/' || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/'
      || lpad(nextval('public.delivery_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists material_readiness_set_number on public.material_readiness;
create trigger material_readiness_set_number
  before insert on public.material_readiness
  for each row execute function public.set_readiness_number();

drop trigger if exists pdis_set_number on public.pdis;
create trigger pdis_set_number
  before insert on public.pdis
  for each row execute function public.set_pdi_number();

drop trigger if exists deliveries_set_number on public.deliveries;
create trigger deliveries_set_number
  before insert on public.deliveries
  for each row execute function public.set_delivery_number();

alter table public.material_readiness add constraint material_readiness_number_key unique (readiness_number);
alter table public.pdis add constraint pdis_number_key unique (pdi_number);
alter table public.deliveries add constraint deliveries_number_key unique (delivery_number);

-- The audit backfill above is a system write; strip the null-actor rows as before.
delete from public.audit_log
where actor_id is null
  and (
    (table_name = 'material_readiness' and changed_fields && array['readiness_number'])
    or (table_name = 'pdis' and changed_fields && array['pdi_number'])
    or (table_name = 'deliveries' and changed_fields && array['delivery_number'])
  );
