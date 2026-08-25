-- =============================================================
-- SPUDS — keep the demo parties perpetually upcoming
-- Seeded parties are anchored to their seed date, so after a quiet week
-- the whole feed ages into the past and Discover looks dead. This rolls
-- them forward nightly, in Chicago evening hours.
--
-- Only touches the fixed seed UUIDs — real parties are never rewritten.
-- =============================================================

create or replace function public.refresh_demo_parties()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  base timestamp := date_trunc('day', now() AT TIME ZONE 'America/Chicago');
begin
  with sched(id, d, sh, eh) as (values
    ('e0000000-0000-0000-0000-000000000008'::uuid, 1,  19, 22),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 2,  18, 22),
    ('e0000000-0000-0000-0000-000000000011'::uuid, 2,  18, 22),
    ('e0000000-0000-0000-0000-000000000005'::uuid, 3,  18, 21),
    ('e0000000-0000-0000-0000-000000000002'::uuid, 4,  19, 23),
    ('e0000000-0000-0000-0000-000000000006'::uuid, 5,  18, 21),
    ('e0000000-0000-0000-0000-000000000003'::uuid, 6,  14, 18),
    ('e0000000-0000-0000-0000-000000000010'::uuid, 7,  16, 21),
    ('e0000000-0000-0000-0000-000000000004'::uuid, 9,  12, 22),
    ('e0000000-0000-0000-0000-000000000007'::uuid, 11, 19, 23)
  )
  update public.events e
  set start_time = (base + make_interval(days => s.d, hours => s.sh))
                     AT TIME ZONE 'America/Chicago',
      end_time   = (base + make_interval(days => s.d, hours => s.eh))
                     AT TIME ZONE 'America/Chicago'
  from sched s
  where e.id = s.id;

  -- The completed weekly stays in the past so reviews and history hold up.
  update public.events
  set start_time = (base - interval '5 days' + interval '18 hours')
                     AT TIME ZONE 'America/Chicago',
      end_time   = (base - interval '5 days' + interval '22 hours')
                     AT TIME ZONE 'America/Chicago'
  where id = 'e0000000-0000-0000-0000-000000000009';
end;
$$;

create extension if not exists pg_cron;

-- Re-schedule idempotently: unschedule first if it already exists.
do $$
begin
  perform cron.unschedule('refresh-demo-parties');
exception when others then
  null;
end;
$$;

-- 08:00 UTC ≈ 3am Chicago, well away from anyone browsing.
select cron.schedule(
  'refresh-demo-parties',
  '0 8 * * *',
  $$select public.refresh_demo_parties();$$
);
