-- =============================================================
-- SPUDS — retire the "casual" event type
-- Spuds is for structured gaming events (tournaments, LANs, clubs,
-- watch parties), not vague hangouts. Existing casual rows become clubs.
-- =============================================================

update public.events set event_type = 'club' where event_type = 'casual';

alter table public.events drop constraint if exists events_event_type_check;

alter table public.events
  add constraint events_event_type_check
  check (event_type in ('tournament', 'lan', 'club', 'watch_party'));

alter table public.events alter column event_type set default 'club';
