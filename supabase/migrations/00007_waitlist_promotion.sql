-- =============================================================
-- SPUDS — waitlist auto-promotion
-- When a confirmed ("going") attendee cancels and frees a spot,
-- promote the earliest-joined waitlisted attendee to "going".
-- The promotion is itself an update, so the existing chat trigger
-- adds the promoted player to the party chat automatically.
-- =============================================================

create or replace function public.handle_waitlist_promotion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  cap integer;
  going_count integer;
  next_id uuid;
begin
  -- Only act when a confirmed spot is actually freed.
  if not (old.status = 'going' and new.status = 'cancelled') then
    return new;
  end if;

  select capacity into cap from public.events where id = new.event_id;

  select count(*) into going_count
    from public.event_attendees
    where event_id = new.event_id and status = 'going';

  -- A spot is open — bump in the next person in line (oldest RSVP first).
  if going_count < cap then
    select id into next_id
      from public.event_attendees
      where event_id = new.event_id and status = 'waitlist'
      order by joined_at asc
      limit 1;

    if next_id is not null then
      update public.event_attendees
        set status = 'going'
        where id = next_id;
    end if;
  end if;

  return new;
end;
$$;

-- Runs before on_rsvp_change alphabetically; both are AFTER triggers so order
-- is not important here. The promoted row's update re-fires the chat trigger
-- but not this one (its transition is waitlist -> going, not going -> cancelled).
create trigger on_attendee_cancel_promote
  after update on public.event_attendees
  for each row execute function public.handle_waitlist_promotion();
