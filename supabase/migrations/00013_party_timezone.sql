-- =============================================================
-- SPUDS — parties carry their own timezone
-- A party happens at a place, so its start time must always read in the
-- venue's local time — not in whatever timezone the viewer happens to be.
-- Existing rows are Chicago; new parties capture the host's zone on create.
-- =============================================================

alter table public.events
  add column if not exists timezone text not null default 'America/Chicago';

-- Keep email dispatch in the party's own zone too.
create or replace function public.dispatch_notification_email()
returns trigger
language plpgsql
security definer set search_path = public, net, extensions
as $$
declare
  cfg record;
  recipient record;
  party record;
  actor_name text;
begin
  select * into cfg from private.email_config where id = 1;
  if cfg is null then
    return new;
  end if;

  if new.type not in ('waitlist_promoted', 'new_rsvp', 'new_review') then
    return new;
  end if;

  select p.unsubscribe_token, p.email_opt_in, u.email
    into recipient
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = new.user_id;

  if recipient is null or not recipient.email_opt_in or recipient.email is null then
    return new;
  end if;

  select title,
         to_char(start_time AT TIME ZONE coalesce(timezone, 'America/Chicago'),
                 'Dy Mon DD, HH12:MI AM') as when_text
    into party
    from public.events where id = new.event_id;

  select coalesce(display_name, username) into actor_name
    from public.profiles where id = new.actor_id;

  perform net.http_post(
    url     := cfg.endpoint,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-spuds-secret', cfg.secret
               ),
    body    := jsonb_build_object(
                 'to', recipient.email,
                 'type', new.type,
                 'unsubscribe_token', recipient.unsubscribe_token,
                 'party_title', coalesce(party.title, ''),
                 'when', coalesce(party.when_text, ''),
                 'actor_name', coalesce(actor_name, 'Someone'),
                 'link', 'https://getspuds.com' || new.link
               )
  );

  update public.notifications set emailed_at = now() where id = new.id;
  return new;
end;
$$;
