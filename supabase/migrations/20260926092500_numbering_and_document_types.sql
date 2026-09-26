-- Recovered requirement (client requirement matrix): automatic RFI and quotation
-- numbering, and the missing attachment types (RFQ, quotation, commission invoice).
--
-- Numbers are assigned by a DB trigger, not the app, so every path (Server
-- Action, import script, SQL) gets one. Format: RFI/YYYY/NNNN and QTN/YYYY/NNNN,
-- with the year in IST.

create sequence if not exists public.rfi_number_seq;
create sequence if not exists public.quotation_number_seq;

alter table public.requirements add column if not exists rfi_number text;
alter table public.quotations add column if not exists quotation_number text;

-- Backfill existing rows in creation order, then move the sequences past them.
with ordered as (
  select id, row_number() over (order by created_at, id) as rn, created_at
  from public.requirements
  where rfi_number is null
)
update public.requirements r
set rfi_number = 'RFI/' || to_char(o.created_at, 'YYYY') || '/' || lpad(o.rn::text, 4, '0')
from ordered o
where o.id = r.id;

with ordered as (
  select id, row_number() over (order by created_at, id) as rn, created_at
  from public.quotations
  where quotation_number is null
)
update public.quotations q
set quotation_number = 'QTN/' || to_char(o.created_at, 'YYYY') || '/' || lpad(o.rn::text, 4, '0')
from ordered o
where o.id = q.id;

select setval('public.rfi_number_seq', greatest((select count(*) from public.requirements), 1));
select setval('public.quotation_number_seq', greatest((select count(*) from public.quotations), 1));

create or replace function public.set_rfi_number()
returns trigger
language plpgsql
as $$
begin
  if new.rfi_number is null then
    new.rfi_number := 'RFI/'
      || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/'
      || lpad(nextval('public.rfi_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists requirements_set_rfi_number on public.requirements;
create trigger requirements_set_rfi_number
  before insert on public.requirements
  for each row execute function public.set_rfi_number();

create or replace function public.set_quotation_number()
returns trigger
language plpgsql
as $$
begin
  if new.quotation_number is null then
    new.quotation_number := 'QTN/'
      || to_char(now() at time zone 'Asia/Kolkata', 'YYYY') || '/'
      || lpad(nextval('public.quotation_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists quotations_set_number on public.quotations;
create trigger quotations_set_number
  before insert on public.quotations
  for each row execute function public.set_quotation_number();

alter table public.requirements
  add constraint requirements_rfi_number_key unique (rfi_number);
alter table public.quotations
  add constraint quotations_number_key unique (quotation_number);

-- Attachment types flagged by the client.
alter type public.document_type add value if not exists 'rfq';
alter type public.document_type add value if not exists 'quotation';
alter type public.document_type add value if not exists 'commission_invoice';
