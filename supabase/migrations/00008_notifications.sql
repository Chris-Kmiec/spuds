-- =============================================================
-- SPUDS — notifications
-- In-app notifications created by DB triggers for the moments that
-- matter: waitlist promotion, a new RSVP to your party, a new review,
-- and a new follower.
-- =============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,   -- recipient
  actor_id uuid references public.profiles (id) on delete set null,          -- who caused it
  type text not null
    check (type in ('waitlist_promoted', 'new_rsvp', 'new_review', 'new_follow')),
  event_id uuid references public.events (id) on delete cascade,
  body text not null,
  link text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where not read;

grant all on public.notifications to anon, authenticated, service_role;

alter table public.notifications enable row level security;

create policy "users read own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

alter publication supabase_realtime add table public.notifications;

-- ---------- helper: insert a notification (skips self-notifications) ----------
create or replace function public.create_notification(
  p_user uuid, p_actor uuid, p_type text, p_event uuid, p_body text, p_link text
)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.notifications (user_id, actor_id, type, event_id, body, link)
  select p_user, p_actor, p_type, p_event, p_body, p_link
  where p_user is not null
    and p_user is distinct from p_actor;
$$;

-- ---------- RSVP → notify host; promotion → notify the attendee ----------
create or replace function public.notify_on_rsvp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor_name text;
  party_title text;
begin
  if new.status = 'going'
     and (tg_op = 'INSERT' or old.status is distinct from 'going') then
    select coalesce(display_name, username) into actor_name
      from public.profiles where id = new.user_id;
    select title into party_title from public.events where id = new.event_id;

    perform public.create_notification(
      (select host_id from public.events where id = new.event_id),
      new.user_id, 'new_rsvp', new.event_id,
      actor_name || ' is coming to ' || party_title,
      '/events/' || new.event_id
    );
  end if;

  -- Promoted from the waitlist (spot opened up).
  if tg_op = 'UPDATE' and old.status = 'waitlist' and new.status = 'going' then
    select title into party_title from public.events where id = new.event_id;
    perform public.create_notification(
      new.user_id, null, 'waitlist_promoted', new.event_id,
      'A spot opened up — you''re in for ' || party_title || '!',
      '/events/' || new.event_id
    );
  end if;

  return new;
end;
$$;

create trigger on_attendee_notify
  after insert or update on public.event_attendees
  for each row execute function public.notify_on_rsvp();

-- ---------- new review → notify the host being reviewed ----------
create or replace function public.notify_on_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor_name text;
begin
  select coalesce(display_name, username) into actor_name
    from public.profiles where id = new.reviewer_id;

  perform public.create_notification(
    new.reviewed_user_id, new.reviewer_id, 'new_review', new.event_id,
    actor_name || ' reviewed your party',
    '/events/' || new.event_id
  );
  return new;
end;
$$;

create trigger on_review_notify
  after insert on public.reviews
  for each row execute function public.notify_on_review();

-- ---------- new follow → notify the followed user ----------
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor_name text;
  actor_username text;
begin
  select coalesce(display_name, username), username
    into actor_name, actor_username
    from public.profiles where id = new.follower_id;

  perform public.create_notification(
    new.following_id, new.follower_id, 'new_follow', null,
    actor_name || ' started following you',
    '/profile/' || actor_username
  );
  return new;
end;
$$;

create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();
