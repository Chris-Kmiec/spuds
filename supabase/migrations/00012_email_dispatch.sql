-- =============================================================
-- SPUDS — dispatch notification emails from the database
-- pg_net posts the fully-assembled payload to our API route, so the app
-- needs no service-role access and there's no webhook to wire up by hand.
-- =============================================================

create extension if not exists pg_net with schema extensions;

-- Endpoint + shared secret live here, never in git. Locked down so only
-- security-definer functions can read them.
create schema if not exists private;

create table if not exists private.email_config (
  id int primary key default 1 check (id = 1),
  endpoint text not null,
  secret text not null
);

revoke all on schema private from anon, authenticated;
revoke all on private.email_config from anon, authenticated;

-- pg_net exposes its functions in the `net` schema regardless of where the
-- extension itself is installed, so it must be on the search_path.
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
    return new;  -- email not configured yet; in-app notification still stands
  end if;

  -- Only email people who haven't opted out, and only types worth an email.
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
         to_char(start_time AT TIME ZONE 'America/Chicago', 'Dy Mon DD, HH12:MI AM') as when_text
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

drop trigger if exists on_notification_email on public.notifications;
create trigger on_notification_email
  after insert on public.notifications
  for each row execute function public.dispatch_notification_email();
