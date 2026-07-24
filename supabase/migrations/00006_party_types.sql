-- =============================================================
-- SPUDS — drop "club" event type; parties are Video games,
-- Tabletop games, or TV and movies. Communities cover the
-- recurring-group use case that "club meetup" duplicated.
-- Existing club rows (all video-game gatherings) fold into gaming_party.
-- =============================================================

alter table public.events drop constraint if exists events_event_type_check;

update public.events
  set event_type = 'gaming_party'
  where event_type = 'club';

alter table public.events
  add constraint events_event_type_check
  check (event_type in ('gaming_party', 'board_game', 'watch_party'));

alter table public.events alter column event_type set default 'gaming_party';
