-- =============================================================
-- SPUDS — rename LAN party to "Gaming party" (video games), drop Tournament
-- Event types are now: gaming_party, watch_party, club.
-- Existing lan/tournament rows fold into gaming_party.
-- =============================================================

-- Drop the old constraint first so the rename update is allowed.
alter table public.events drop constraint if exists events_event_type_check;

update public.events
  set event_type = 'gaming_party'
  where event_type in ('lan', 'tournament');

alter table public.events
  add constraint events_event_type_check
  check (event_type in ('gaming_party', 'watch_party', 'club'));

alter table public.events alter column event_type set default 'gaming_party';
