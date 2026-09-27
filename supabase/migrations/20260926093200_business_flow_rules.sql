-- Business flow logic — the chain rules from the client's brief, enforced at the
-- database so no screen, script or direct call can bypass them:
--
--   RFI -> Quotation -> Purchase Order -> OEM Invoice -> Delivery -> Payment -> Commission
--
-- Where each rule already lives:
--   * every quotation originates from an RFI        -> quotations.requirement_id NOT NULL + composite FK
--   * every PO maps to an approved quotation        -> tightened below (was: any submitted status)
--   * multiple invoices per PO                       -> no unique constraint on oem_invoices.purchase_order_id
--   * multiple deliveries per invoice                -> no unique constraint on deliveries.oem_invoice_id
--   * commission only after the OEM payment milestone-> commission_invoices_require_payment (unchanged)
--   * partial deliveries / partial payments          -> cumulative caps below
--   * complete audit trail                           -> per-table audit triggers (unchanged)
--
-- This migration closes two real gaps found by review:
--   1. the PO gate accepted 'submitted' and 'awaiting_approval', which are not
--      approvals — a PO could be raised from a quotation nobody had approved;
--   2. nothing stopped a delivery or a payment from exceeding the invoiced
--      quantity or amount, so a "partial" could silently become an over-run.

-- 1. A PO may only come from a quotation that actually passed both approval
--    levels. Status alone is not enough: an approved quotation may later be
--    submitted or won, and all three are legitimate, but each still has the
--    two approval rows on record. The reviewed one-off historical import keeps
--    its exemption (app.import_mode), as it may load POs whose quotations
--    predate the approval table.
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

  if coalesce(current_setting('app.import_mode', true), 'off') = 'on' then
    return new;
  end if;

  if not public.has_two_level_approval('quotation', new.quotation_id, 'quotation_submitted') then
    raise exception
      'PO % can only be created from an approved quotation; quotation % is % with no Group Head and Management approval on record',
      new.po_number, new.quotation_id, q_status
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- 2. Deliveries against one invoice are partial by nature; their running total
--    must never exceed the quantity invoiced on that invoice.
create or replace function public.enforce_delivery_within_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoiced numeric(14, 3);
  v_already numeric(14, 3);
begin
  select quantity_invoiced into v_invoiced
  from public.oem_invoices
  where id = new.oem_invoice_id;

  if v_invoiced is null then
    raise exception 'Delivery references unknown OEM invoice %', new.oem_invoice_id
      using errcode = '23514';
  end if;

  select coalesce(sum(d.quantity_delivered), 0) into v_already
  from public.deliveries d
  where d.oem_invoice_id = new.oem_invoice_id
    and d.id <> new.id;

  if v_already + new.quantity_delivered > v_invoiced then
    raise exception
      'Delivery of % would total % delivered against invoice % which is only % invoiced; a delivery cannot exceed the invoice balance',
      new.quantity_delivered, v_already + new.quantity_delivered, new.oem_invoice_id, v_invoiced
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger deliveries_within_invoice_quantity
  before insert or update of quantity_delivered, oem_invoice_id on public.deliveries
  for each row execute function public.enforce_delivery_within_invoice();

-- 3. Payments against one invoice are partial by nature; their running total
--    must never exceed the invoice's gross amount.
create or replace function public.enforce_payment_within_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gross numeric(14, 2);
  v_already numeric(14, 2);
begin
  select gross_amount into v_gross
  from public.oem_invoices
  where id = new.oem_invoice_id;

  if v_gross is null then
    raise exception 'Payment references unknown OEM invoice %', new.oem_invoice_id
      using errcode = '23514';
  end if;

  select coalesce(sum(p.amount_received), 0) into v_already
  from public.payments p
  where p.oem_invoice_id = new.oem_invoice_id
    and p.id <> new.id;

  if v_already + new.amount_received > v_gross then
    raise exception
      'Payment of % would total % received against invoice % which is only % gross; a payment cannot exceed the invoice balance',
      new.amount_received, v_already + new.amount_received, new.oem_invoice_id, v_gross
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger payments_within_invoice_amount
  before insert or update of amount_received, oem_invoice_id on public.payments
  for each row execute function public.enforce_payment_within_invoice();
