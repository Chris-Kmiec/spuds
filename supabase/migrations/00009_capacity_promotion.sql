-- =============================================================
-- SPUDS — promote waitlisters when a host raises capacity
-- If an edit increases a party's capacity, fill the new spots from
-- the waitlist (oldest first) until full or the waitlist runs out.
-- Each promotion re-fires the chat + notification triggers.
-- =============================================================

create or replace function public.handle_capacity_increase()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  going_count integer;
  next_id uuid;
begin
  if new.capacity <= old.capacity then
    return new;
  end if;

  loop
    select count(*) into going_count
      from public.event_attendees
      where event_id = new.id and status = 'going';
    exit when going_count >= new.capacity;

    select id into next_id
      from public.event_attendees
      where event_id = new.id and status = 'waitlist'
      order by joined_at asc
      limit 1;
    exit when next_id is null;

    update public.event_attendees set status = 'going' where id = next_id;
  end loop;

  return new;
end;
$$;

create trigger on_capacity_increase
  after update on public.events
  for each row execute function public.handle_capacity_increase();
