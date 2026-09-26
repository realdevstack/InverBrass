-- Two-level approval: Group Head first, then Management. The order is enforced
-- here, not in the UI, so no path can advance a stage on one approval.

create or replace function public.record_approval(
  p_stage public.approval_stage,
  p_entity_type text,
  p_entity_id uuid,
  p_level public.approval_level,
  p_decision public.approval_decision,
  p_note text default null
)
returns public.approvals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := public.auth_role();
  v_row public.approvals;
begin
  if v_role is null or v_role not in ('owner', 'group_head', 'management') then
    raise exception 'Only an approver role may record an approval'
      using errcode = '42501';
  end if;

  -- Management can only act after a Group Head approval exists for this stage.
  if p_level = 'management' then
    if not exists (
      select 1 from public.approvals
      where entity_type = p_entity_type
        and entity_id = p_entity_id
        and stage = p_stage
        and level = 'group_head'
        and decision = 'approved'
    ) then
      raise exception 'Management approval requires a Group Head approval first'
        using errcode = '23514';
    end if;
  end if;

  insert into public.approvals (stage, entity_type, entity_id, level, decision, actor_id, note, decided_at)
  values (p_stage, p_entity_type, p_entity_id, p_level, p_decision, auth.uid(), p_note, now())
  on conflict (entity_type, entity_id, stage, level)
  do update set
    decision = excluded.decision,
    actor_id = excluded.actor_id,
    note = excluded.note,
    decided_at = excluded.decided_at
  returning * into v_row;

  -- Advance the record only once both levels are approved, in order.
  if public.has_two_level_approval(p_entity_type, p_entity_id, p_stage) then
    if p_entity_type = 'quotation' and p_stage = 'quotation_submitted' then
      update public.quotations
      set status = 'approved'
      where id = p_entity_id and status <> 'approved';
    end if;
  end if;

  return v_row;
end;
$$;

revoke all on function public.record_approval(public.approval_stage, text, uuid, public.approval_level, public.approval_decision, text) from public, anon;
grant execute on function public.record_approval(public.approval_stage, text, uuid, public.approval_level, public.approval_decision, text) to authenticated;

grant execute on function public.has_two_level_approval(text, uuid, public.approval_stage) to authenticated;
