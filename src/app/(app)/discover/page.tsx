import { DiscoverFilters } from "@/components/discover-filters";
import { EventCard, type EventCardData } from "@/components/event-card";
import { NotificationBell } from "@/components/notification-bell";
import { PartiesMap } from "@/components/parties-map";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Community, EventRow, GamingProfile, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { List, Map as MapIcon, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = { title: "Discover" };

type RawEvent = EventRow & {
  host: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  attendees: { status: string }[];
};

function toCard(
  e: RawEvent,
  ratings: Map<string, number>
): EventCardData {
  return {
    ...e,
    going: e.attendees.filter((a) => a.status === "going").length,
    hostRating: ratings.get(e.host_id) ?? null,
  };
}

function isWeekend(iso: string) {
  const day = new Date(iso).getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

function endOfWeekend() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    when?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  let query = supabase
    .from("events")
    .select(
      "*, host:profiles!events_host_id_fkey(id, username, display_name, avatar_url), attendees:event_attendees(status)"
    )
    .eq("status", "published")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(60);

  if (params.q) {
    query = query.or(
      `title.ilike.%${params.q}%,description.ilike.%${params.q}%`
    );
  }
  if (params.type) query = query.eq("event_type", params.type);

  const [
    { data: eventsData },
    { data: gamingProfile },
    { data: communities },
    { count: unreadCount },
  ] = await Promise.all([
    query,
    profile
      ? supabase
          .from("gaming_profiles")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("communities")
      .select("*, members:community_members(count)")
      .limit(6),
    profile
      ? supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("read", false)
      : Promise.resolve({ count: 0 }),
  ]);

  const events = (eventsData ?? []) as unknown as RawEvent[];

  // Host ratings in one query
  const hostIds = [...new Set(events.map((e) => e.host_id))];
  const ratings = new Map<string, number>();
  if (hostIds.length > 0) {
    const { data: stats } = await supabase
      .from("host_stats")
      .select("host_id, avg_rating, review_count")
      .in("host_id", hostIds);
    for (const s of stats ?? []) {
      if (Number(s.review_count) > 0)
        ratings.set(s.host_id as string, Number(s.avg_rating));
    }
  }

  let cards = events.map((e) => toCard(e, ratings));
  const gp = gamingProfile as GamingProfile | null;

  // Day-of-week filter (Sat/Sun = weekend), matching how dates are displayed.
  if (params.when === "weekend") {
    cards = cards.filter((c) => isWeekend(c.start_time));
  } else if (params.when === "weekday") {
    cards = cards.filter((c) => !isWeekend(c.start_time));
  }

  const filtering = !!params.q || !!params.type || !!params.when;

  const featured = cards.filter((e) => e.featured);
  const favoriteGames = new Set(gp?.favorite_games ?? []);
  const recommended = cards.filter(
    (e) => !e.featured && e.games.some((g) => favoriteGames.has(g))
  );
  const weekendCutoff = endOfWeekend();
  const thisWeekend = cards.filter(
    (e) => new Date(e.start_time) < weekendCutoff
  );

  const viewer = profile
    ? { latitude: profile.latitude, longitude: profile.longitude }
    : null;

  const isMap = params.view === "map";
  const mapCenter = {
    lat: profile?.latitude ?? 41.8781, // Chicago fallback
    lng: profile?.longitude ?? -87.6298,
  };
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  // Preserve active filters when switching between list and map.
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.type) qs.set("type", params.type);
  if (params.when) qs.set("when", params.when);
  const listHref = `/discover${qs.toString() ? `?${qs}` : ""}`;
  const mapQs = new URLSearchParams(qs);
  mapQs.set("view", "map");
  const mapHref = `/discover?${mapQs}`;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between pt-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-soil-800/50">
            {profile?.location ?? "Near you"}
          </p>
          <h1 className="font-display text-3xl font-black">
            Hey {profile?.display_name?.split(" ")[0] ?? profile?.username} 👋
          </h1>
          <p className="text-soil-800/60">What are we playing this week?</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={isMap ? listHref : mapHref}
            aria-label={isMap ? "Back to list" : "View parties on a map"}
            className={cn(
              "rounded-full p-2.5 shadow-sm shadow-soil-800/5 transition-colors",
              isMap
                ? "bg-spud-400 text-white hover:bg-spud-500"
                : "bg-white text-soil-800/70 hover:bg-cream-100"
            )}
          >
            {isMap ? (
              <List className="size-5" />
            ) : (
              <MapIcon className="size-5" />
            )}
          </Link>
          {profile && (
            <NotificationBell
              userId={profile.id}
              initialUnread={unreadCount ?? 0}
            />
          )}
        </div>
      </header>

      <Suspense>
        <DiscoverFilters />
      </Suspense>

      {isMap ? (
        <section className="space-y-3">
          <p className="text-sm text-soil-800/60">
            {cards.length} {cards.length === 1 ? "party" : "parties"} on the map
          </p>
          <PartiesMap
            parties={cards.map((c) => ({
              id: c.id,
              title: c.title,
              latitude: c.latitude,
              longitude: c.longitude,
              start_time: c.start_time,
              location_name: c.location_name,
              image_url: c.image_url,
              type_label: EVENT_TYPE_LABELS[c.event_type] ?? "Party",
              event_type: c.event_type,
              games: c.games,
              going: c.going,
              capacity: c.capacity,
              host_name: c.host.display_name ?? c.host.username,
              host_avatar: c.host.avatar_url,
            }))}
            center={mapCenter}
            token={mapboxToken}
          />
        </section>
      ) : filtering ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-extrabold">
            {cards.length} {cards.length === 1 ? "party" : "parties"} found
          </h2>
          {cards.length === 0 && (
            <Card className="p-8 text-center text-soil-800/60">
              <div className="text-3xl">🥔</div>
              <p className="mt-2 font-semibold">No parties match — yet.</p>
              <p className="mt-1 text-sm">
                Try different filters, or{" "}
                <Link href="/create" className="font-semibold text-spud-500">
                  host one yourself
                </Link>
                .
              </p>
            </Card>
          )}
          {cards.map((e) => (
            <EventCard key={e.id} event={e} viewer={viewer} />
          ))}
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <Rail title="Featured">
              {featured.map((e) => (
                <EventCard key={e.id} event={e} viewer={viewer} layout="rail" />
              ))}
            </Rail>
          )}

          {recommended.length > 0 && (
            <Rail title="For you">
              {recommended.map((e) => (
                <EventCard key={e.id} event={e} viewer={viewer} layout="rail" />
              ))}
            </Rail>
          )}

          {thisWeekend.length > 0 && (
            <Rail title="This weekend">
              {thisWeekend.map((e) => (
                <EventCard key={e.id} event={e} viewer={viewer} layout="rail" />
              ))}
            </Rail>
          )}

          {communities && communities.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-extrabold">
                Communities nearby
              </h2>
              <div className="scroll-rail flex gap-3 overflow-x-auto pb-2">
                {(communities as (Community & { members: { count: number }[] })[]).map(
                  (c) => (
                    <Link
                      key={c.id}
                      href={`/communities/${c.slug}`}
                      className="w-56 shrink-0"
                    >
                      <Card className="overflow-hidden transition-transform hover:-translate-y-0.5">
                        <div className="relative h-24 bg-cream-200">
                          {c.image_url && (
                            <Image
                              src={c.image_url}
                              alt={c.name}
                              fill
                              sizes="224px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="truncate font-display text-sm font-extrabold">
                            {c.name}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-soil-800/60">
                            <Users className="size-3.5" />
                            {c.members?.[0]?.count ?? 0} members ·{" "}
                            {c.location?.split(",")[0]}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  )
                )}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="font-display text-lg font-extrabold">
              All upcoming
            </h2>
            {cards.length === 0 && (
              <Card className="p-8 text-center text-soil-800/60">
                <div className="text-3xl">🌱</div>
                <p className="mt-2 font-semibold">
                  No upcoming parties near you yet.
                </p>
                <p className="mt-1 text-sm">
                  Be the first —{" "}
                  <Link href="/create" className="font-semibold text-spud-500">
                    host something
                  </Link>{" "}
                  and your scene will grow around it.
                </p>
              </Card>
            )}
            {cards.map((e) => (
              <EventCard key={e.id} event={e} viewer={viewer} />
            ))}
          </section>
        </>
      )}

      {gp && gp.favorite_games.length > 0 && !filtering && (
        <p className="pb-2 text-center text-xs text-soil-800/40">
          Recommendations based on{" "}
          {gp.favorite_games.slice(0, 3).join(", ")}
          {gp.favorite_games.length > 3 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

function Rail({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-extrabold">{title}</h2>
      <div className="scroll-rail flex gap-3 overflow-x-auto pb-2">
        {children}
      </div>
    </section>
  );
}
