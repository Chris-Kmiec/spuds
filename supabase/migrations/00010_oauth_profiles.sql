-- =============================================================
-- SPUDS — make profile creation OAuth-aware (Discord)
-- Email signup sends `username`; Discord sends preferred_username /
-- user_name / full_name / avatar_url instead. Derive a clean, unique
-- username from whatever we get, and keep the Discord avatar.
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_name text;
  base text;
  candidate text;
  suffix int := 0;
begin
  -- Preferred sources, in order of how much we trust them.
  raw_name := coalesce(
    meta ->> 'username',            -- our own email signup
    meta ->> 'preferred_username',  -- Discord
    meta ->> 'user_name',           -- Discord (alt key)
    split_part(coalesce(new.email, ''), '@', 1)
  );

  -- Normalise to our username rules: lowercase, [a-z0-9_], 3-24 chars.
  base := lower(coalesce(raw_name, ''));
  base := regexp_replace(base, '[^a-z0-9_]', '_', 'g');
  base := regexp_replace(base, '_+', '_', 'g');
  base := trim(both '_' from base);
  if length(base) < 3 then
    base := 'player_' || substr(new.id::text, 1, 8);
  end if;
  base := substr(base, 1, 24);

  -- Guarantee uniqueness so OAuth signup can never fail on a collision.
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := substr(base, 1, 24 - length(suffix::text) - 1) || '_' || suffix;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    nullif(coalesce(
      meta ->> 'display_name',
      meta ->> 'full_name',
      meta ->> 'name',
      candidate
    ), ''),
    nullif(coalesce(meta ->> 'avatar_url', meta ->> 'picture', ''), '')
  );

  return new;
end;
$$;
