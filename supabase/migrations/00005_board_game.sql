-- =============================================================
-- SPUDS — add "board_game" event type (tabletop nights)
-- Event types: gaming_party, board_game, watch_party, club.
-- =============================================================

alter table public.events drop constraint if exists events_event_type_check;

alter table public.events
  add constraint events_event_type_check
  check (event_type in ('gaming_party', 'board_game', 'watch_party', 'club'));
