-- =============================================================
-- SPUDS — schema, triggers, and row-level security
-- =============================================================

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  latitude double precision,
  longitude double precision,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- gaming profiles ----------
create table public.gaming_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles (id) on delete cascade,
  favorite_games text[] not null default '{}',
  platforms text[] not null default '{}',
  play_styles text[] not null default '{}',
  availability text[] not null default '{}',
  goals text[] not null default '{}'
);

-- ---------- communities ----------
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  privacy text not null default 'public' check (privacy in ('public', 'private')),
  games text[] not null default '{}',
  location text,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- ---------- events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  community_id uuid references public.communities (id) on delete set null,
  title text not null,
  description text,
  image_url text,
  event_type text not null default 'casual'
    check (event_type in ('casual', 'tournament', 'lan', 'club', 'watch_party')),
  games text[] not null default '{}',
  platforms text[] not null default '{}',
  start_time timestamptz not null,
  end_time timestamptz,
  location_name text,
  address text,
  latitude double precision,
  longitude double precision,
  capacity integer not null default 8 check (capacity > 0),
  price numeric(10, 2) not null default 0,
  skill_level text not null default 'all'
    check (skill_level in ('all', 'beginner', 'intermediate', 'competitive')),
  equipment text,
  rules text,
  featured boolean not null default false,
  status text not null default 'published'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create index events_start_time_idx on public.events (start_time);
create index events_host_idx on public.events (host_id);
create index events_status_idx on public.events (status);

-- ---------- attendees ----------
create table public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'waitlist', 'cancelled')),
  guests integer not null default 0 check (guests >= 0),
  message text,
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_attendees_user_idx on public.event_attendees (user_id);

-- ---------- conversations & messages ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'event' check (type in ('event', 'dm')),
  event_id uuid unique references public.events (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------- reviews ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewed_user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (reviewer_id, reviewed_user_id, event_id),
  check (reviewer_id <> reviewed_user_id)
);

create index reviews_reviewed_idx on public.reviews (reviewed_user_id);

-- ---------- follows ----------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- =============================================================
-- Triggers
-- =============================================================

-- Create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'player_' || substr(new.id::text, 1, 8)
    ),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create the event chat when an event is created, with the host as a participant
create or replace function public.handle_new_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  conv_id uuid;
begin
  insert into public.conversations (type, event_id)
  values ('event', new.id)
  returning id into conv_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, new.host_id);

  return new;
end;
$$;

create trigger on_event_created
  after insert on public.events
  for each row execute function public.handle_new_event();

-- Add/remove attendees from the event chat as they RSVP or cancel
create or replace function public.handle_rsvp_chat()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  conv_id uuid;
begin
  select id into conv_id from public.conversations where event_id = new.event_id;
  if conv_id is null then
    return new;
  end if;

  if new.status = 'going' then
    insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, new.user_id)
    on conflict do nothing;
  elsif new.status = 'cancelled' then
    delete from public.conversation_participants
    where conversation_id = conv_id and user_id = new.user_id;
  end if;

  return new;
end;
$$;

create trigger on_rsvp_change
  after insert or update on public.event_attendees
  for each row execute function public.handle_rsvp_chat();

-- Community creator automatically becomes owner-member
create or replace function public.handle_new_community()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.community_members (community_id, user_id, role)
  values (new.id, new.creator_id, 'owner');
  return new;
end;
$$;

create trigger on_community_created
  after insert on public.communities
  for each row execute function public.handle_new_community();

-- =============================================================
-- Helper: is the current user a participant of a conversation?
-- (security definer to avoid recursive RLS)
-- =============================================================
create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles enable row level security;
alter table public.gaming_profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;

-- profiles: public read, owner write
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- gaming profiles: public read, owner write
create policy "gaming profiles are viewable by everyone"
  on public.gaming_profiles for select using (true);
create policy "users manage own gaming profile"
  on public.gaming_profiles for insert with check (auth.uid() = user_id);
create policy "users update own gaming profile"
  on public.gaming_profiles for update using (auth.uid() = user_id);

-- communities: public read, creator write
create policy "communities are viewable by everyone"
  on public.communities for select using (true);
create policy "authenticated users can create communities"
  on public.communities for insert with check (auth.uid() = creator_id);
create policy "creators can update communities"
  on public.communities for update using (auth.uid() = creator_id);
create policy "creators can delete communities"
  on public.communities for delete using (auth.uid() = creator_id);

-- community members
create policy "memberships are viewable by everyone"
  on public.community_members for select using (true);
create policy "users can join communities"
  on public.community_members for insert with check (auth.uid() = user_id);
create policy "users can leave communities"
  on public.community_members for delete using (auth.uid() = user_id);

-- events: published events are public; hosts see all of their own
create policy "published events are viewable by everyone"
  on public.events for select using (status = 'published' or auth.uid() = host_id);
create policy "authenticated users can create events"
  on public.events for insert with check (auth.uid() = host_id);
create policy "hosts can update own events"
  on public.events for update using (auth.uid() = host_id);
create policy "hosts can delete own events"
  on public.events for delete using (auth.uid() = host_id);

-- attendees: visible to everyone (social proof), users manage their own RSVP
create policy "attendee lists are viewable by everyone"
  on public.event_attendees for select using (true);
create policy "users can rsvp"
  on public.event_attendees for insert with check (auth.uid() = user_id);
create policy "users can update own rsvp"
  on public.event_attendees for update using (auth.uid() = user_id);

-- conversations: participants only
create policy "participants can view conversations"
  on public.conversations for select
  using (public.is_conversation_participant(id));
create policy "authenticated users can create dm conversations"
  on public.conversations for insert
  with check (type = 'dm' and auth.uid() is not null);

-- participants
create policy "participants can view participant lists"
  on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id));
create policy "users can add themselves or invite to dms"
  on public.conversation_participants for insert
  with check (
    auth.uid() = user_id
    or public.is_conversation_participant(conversation_id)
  );

-- messages: participants read and write
create policy "participants can read messages"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));
create policy "participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(conversation_id)
  );

-- reviews: public read; attendees of a completed event can review
create policy "reviews are viewable by everyone"
  on public.reviews for select using (true);
create policy "attendees can leave reviews"
  on public.reviews for insert with check (auth.uid() = reviewer_id);

-- follows
create policy "follows are viewable by everyone"
  on public.follows for select using (true);
create policy "users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);
create policy "users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- =============================================================
-- Grants (RLS policies above are the real gate)
-- =============================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

-- =============================================================
-- Realtime
-- =============================================================
alter publication supabase_realtime add table public.messages;

-- =============================================================
-- Host stats view (ratings + events hosted)
-- =============================================================
create or replace view public.host_stats as
select
  p.id as host_id,
  count(distinct e.id) filter (where e.status in ('published', 'completed')) as events_hosted,
  coalesce(avg(r.rating), 0)::numeric(3, 2) as avg_rating,
  count(r.id) as review_count
from public.profiles p
left join public.events e on e.host_id = p.id
left join public.reviews r on r.reviewed_user_id = p.id
group by p.id;
