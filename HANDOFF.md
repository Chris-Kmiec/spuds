# Spuds — handoff / current state

Living document. **Update it when you finish something**, so any future session
can pick up cold. Last updated: 2026-07-30.

- **Live:** https://getspuds.com (also www → apex redirect)
- **Repo:** https://github.com/Chris-Kmiec/spuds (`main`)
- **Deploy:** `npx vercel deploy --prod --yes --token <token>` from Windows
  (GitHub auto-deploy is *not* connected yet — see Open items)

---

## What's built and verified in production

| Area | Status |
| --- | --- |
| Auth | Email/password **+ Discord OAuth**. Email confirmation is OFF (instant signup). |
| Onboarding | 5-step gaming identity → games, platforms, play style, availability, location |
| Discover | Personalized feed, search, Weekdays/Weekends + party-type filters, distance |
| Map view | Mapbox, type-specific pins (gamepad / dice / TV), Zillow-style bottom sheet |
| Parties | Detail page, RSVP with guests + message, capacity-aware waitlist |
| Waitlist | **Auto-promotion** when a spot frees up, and when a host raises capacity |
| Hosting | Create wizard, **edit party**, host dashboard w/ attendees + stats, cancel |
| Photos | Uploads for party covers, avatars, community banners (Supabase Storage) |
| Social | Communities, profiles, follows, reviews w/ tags, badges |
| Messaging | Realtime party chat + DMs |
| Notifications | In-app inbox + live unread bell, **and real email** (Resend) |

## Product decisions (don't undo these without asking)

1. **"Parties," never "events"** in user-facing copy. Code/routes/DB still use
   `event` — deliberate, so URLs and tables stayed stable.
2. **Party types:** Video games · Tabletop games · TV and movies. Tournament,
   LAN, Club meetup and "casual" were all removed. Communities cover the
   recurring-group use case that Club meetup duplicated.
3. **Casual-first:** skill level was removed from hosting, discovery, and
   party pages entirely.
4. **Price only on the party detail page** — not on cards, not a filter, so
   browsing doesn't lead with cost.
5. **Design system is enforced** — see `DESIGN.md`. `npm run lint:design`
   fails on emoji in UI chrome.
6. **Email stays high-signal**: only waitlist promotion, new RSVP to your
   party, new review, and a day-before reminder. Chat messages and follows are
   deliberately in-app only.

## Architecture notes worth knowing

- **DB triggers own the workflows**: signup creates a profile (OAuth-aware,
  collision-safe usernames), publishing a party opens its chat, RSVP joins you
  to it, cancelling frees a waitlist spot, and notifications are created in SQL.
- **Email dispatch avoids a service-role key in the app**: a Postgres trigger
  uses `pg_net` to POST an assembled payload to `/api/email/notify`, which is
  guarded by a shared secret stored in `private.email_config`.
  (pg_net's functions live in the `net` schema, *not* `extensions.net`.)
- **Reminders** run on a daily Vercel cron and are idempotent per attendee.

## Tests

```bash
npm test          # vitest unit tests (timezone math, pricing, badges, distance)
npm run test:e2e  # playwright, read-only, runs against production by default
```

E2E is deliberately **read-only** so it's safe against production. Override the
target with `E2E_BASE_URL` (e.g. a preview deploy or `http://localhost:3000`).
GitHub Actions runs lint + unit + build on every push/PR, and the e2e suite
against production after a push to `main`.

## Open items / next steps

**Needs the user (dashboard access):**
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — only the day-before reminder
      cron needs it; everything else already works.
- [ ] Connect the GitHub repo in Vercel → Settings → Git for auto-deploys.

**Known gap worth closing:**
- [ ] **Host-created parties have no lat/lng**, so they never appear on the map
      (only seeded parties do). The create wizard collects an address but never
      geocodes it. Fix: geocode on save via the Mapbox token we already have.

**Candidate next features (no keys needed):**
- [ ] Host analytics — views, RSVP conversion, attendance rate, repeat guests
- [ ] Attendance check-in (feeds attendance rate + trust signals)

**Candidate next features (need a key/account):**
- [ ] Stripe payments for paid parties
- [ ] AI-powered recommendations

## Local dev

```powershell
powershell -File start-spuds.ps1
```

Starts the WSL keep-alive, local Supabase, and the dev server. Required after
every reboot — see README for the environment quirks on this machine.
