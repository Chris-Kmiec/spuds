# 🥔 Spuds

**Find your player two.** Spuds helps gamers build real-world friendships through shared gaming experiences.

Core loop: **Discover → Attend → Connect → Return → Host → Grow Community**

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + React 19 + TypeScript
- **Tailwind CSS v4** with the Spuds design system (Spuds Pink `#FF6B8A`, Sprout Green `#6BCB77`, Potato Cream `#FFF4DD`, Inter + Nunito)
- **Supabase** — auth, Postgres with row-level security, and realtime (event chat)

## What's built

| Area | Features |
| --- | --- |
| Auth | Email/password signup + login, session middleware, profile auto-created by DB trigger |
| Onboarding | 5-step gaming identity wizard: games, platforms, play style, availability + goals, location |
| Discover | Personalized feed (Featured / For you / This weekend / Communities nearby), search, filters (free, type, skill), distance display |
| Events | Detail page with host trust signals (rating, reviews, verification), games & equipment, attendee social proof ("people you follow are going"), RSVP with guests + message, capacity-aware waitlist |
| Hosting | 5-step create wizard (basics → games → logistics → audience → preview), host dashboard with fill rates, attendee messages, repeat-player count, cancel flow |
| Messages | Event chats auto-created on publish, members auto-joined on RSVP (DB triggers), realtime chat, DMs from any profile |
| Community | Communities with join/leave, members, community events; profiles with badges (🌱🎮🏆🔥), follows, 5-star reviews with tags |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

**Option A — local via WSL2 (this machine's setup).** Docker Desktop proved unusable on this Windows preview build (it cannot manage unix-socket files), so the Docker engine and Supabase CLI run inside WSL2/Ubuntu instead. After a reboot, run:

```powershell
powershell -File start-spuds.ps1
```

That starts a WSL keep-alive (the VM idle-terminates otherwise, taking the DB with it), the Supabase stack, and the dev server. Note the non-default ports: API `44321`, DB `44322`, Studio `44323` — ports 54321+ collide with Windows' excluded port ranges in WSL mirrored networking mode. Schema and seed apply automatically on first start; use `supabase db reset` inside WSL to reload them.

Seeded demo accounts (all password `spudspass123`):

- `petey@demo.getspuds.com` — Smash TO with reviews and a host rating
- `dana@demo.getspuds.com` — attendee with RSVPs and chats
- …plus 6 more (`maria`, `rachel`, `larry`, `cass`, `frank`, `izzy` @demo.getspuds.com)

**Option B — Supabase cloud.**

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Run the SQL in `supabase/migrations/00001_schema.sql` (SQL Editor), optionally followed by `supabase/seed.sql`
3. Put your project URL and anon key in `.env.local`

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up (or log in as a demo user), and complete onboarding.

## Project structure

```
supabase/
  migrations/00001_schema.sql   # tables, triggers, RLS policies, host_stats view
  seed.sql                      # realistic Chicago gaming scene demo data
src/
  middleware.ts                 # session refresh + private-route gate
  lib/supabase/                 # browser/server Supabase clients
  lib/data.ts                   # shared profile/feed queries
  components/                   # design system (ui/) + event cards, nav, profile view
  app/
    (auth)/login, signup        # auth screens + server actions
    onboarding/                 # gaming identity wizard
    (app)/discover              # personalized feed + search + filters
    (app)/events/[id]           # detail, RSVP, reviews
    (app)/create (+ /manage)    # host wizard + dashboard
    (app)/messages (+ /[id])    # inbox + realtime chat
    (app)/communities           # browse, create, detail
    (app)/profile (+ /[username])
```

## Architecture notes

- **RLS everywhere** — the browser talks to Supabase directly for chat; policies (not app code) enforce that only event attendees can read/write an event's conversation.
- **DB triggers own the workflows** — signing up creates a profile, publishing an event creates its chat, RSVPing joins you to it, cancelling removes you. The app never has to remember to do these.
- **`host_stats` view** powers host ratings on cards, event pages, profiles, and the dashboard from one source of truth.

## Phase 2 (not yet built)

Payments (Stripe), Mapbox map view, tournaments, AI recommendations, Discord integration, calendar sync, gamification beyond badges.
