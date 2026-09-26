-- The numbering backfill updated every requirement and quotation, and the audit
-- trigger recorded those system writes with a null actor. A migration is not a
-- user action, so remove those synthetic rows; genuine changes keep their actor.

delete from public.audit_log
where actor_id is null
  and table_name in ('requirements', 'quotations')
  and (
    changed_fields && array['rfi_number']
    or changed_fields && array['quotation_number']
  );
