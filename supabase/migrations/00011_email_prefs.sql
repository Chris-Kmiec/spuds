-- =============================================================
-- SPUDS — email preferences, unsubscribe, and send tracking
-- =============================================================

alter table public.profiles
  add column if not exists email_opt_in boolean not null default true,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists profiles_unsubscribe_token_idx
  on public.profiles (unsubscribe_token);

-- Remember which notifications we've emailed so retries can't double-send.
alter table public.notifications
  add column if not exists emailed_at timestamptz;

-- Reminders are sent once per attendee per party.
create table if not exists public.party_reminders (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.party_reminders enable row level security;
grant all on public.party_reminders to anon, authenticated, service_role;

-- Unsubscribing happens from an email link, so it must work without a session.
-- Scoped to a single random token, which only the recipient has.
create or replace function public.unsubscribe_by_token(p_token uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  hit int;
begin
  update public.profiles
    set email_opt_in = false
    where unsubscribe_token = p_token;
  get diagnostics hit = row_count;
  return hit > 0;
end;
$$;

grant execute on function public.unsubscribe_by_token(uuid) to anon, authenticated;
