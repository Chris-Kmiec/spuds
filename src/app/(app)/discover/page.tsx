import { DiscoverFilters } from "@/components/discover-filters";
import { EventCard, type EventCardData } from "@/components/event-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Community, EventRow, GamingProfile, Profile } from "@/lib/types";
import { Users } from "lucide-react";
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
    skill?: string;
    free?: string;
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
  if (params.skill) query = query.eq("skill_level", params.skill);
  if (params.free === "1") query = query.eq("price", 0);

  const [{ data: eventsData }, { data: gamingProfile }, { data: communities }] =
    await Promise.all([
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

  const cards = events.map((e) => toCard(e, ratings));
  const gp = gamingProfile as GamingProfile | null;

  const filtering =
    !!params.q || !!params.type || !!params.skill || params.free === "1";

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

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm font-semibold text-spud-500">
          {profile?.location ?? "Near you"}
        </p>
        <h1 className="font-display text-3xl font-black">
          Hey {profile?.display_name?.split(" ")[0] ?? profile?.username} 👋
        </h1>
        <p className="text-soil-800/60">What are we playing this week?</p>
      </header>

      <Suspense>
        <DiscoverFilters />
      </Suspense>

      {filtering ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-extrabold">
            {cards.length} {cards.length === 1 ? "event" : "events"} found
          </h2>
          {cards.length === 0 && (
            <Card className="p-8 text-center text-soil-800/60">
              <div className="text-3xl">🥔</div>
              <p className="mt-2 font-semibold">No events match — yet.</p>
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
            <Rail title="Featured" emoji="⭐">
              {featured.map((e) => (
                <EventCard key={e.id} event={e} viewer={viewer} layout="rail" />
              ))}
            </Rail>
          )}

          {recommended.length > 0 && (
            <Rail title="For you" emoji="🎯">
              {recommended.map((e) => (
                <EventCard key={e.id} event={e} viewer={viewer} layout="rail" />
              ))}
            </Rail>
          )}

          {thisWeekend.length > 0 && (
            <Rail title="This weekend" emoji="🔥">
              {thisWeekend.map((e) => (
                <EventCard key={e.id} event={e} viewer={viewer} layout="rail" />
              ))}
            </Rail>
          )}

          {communities && communities.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-extrabold">
                🏘️ Communities nearby
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
              📅 All upcoming
            </h2>
            {cards.length === 0 && (
              <Card className="p-8 text-center text-soil-800/60">
                <div className="text-3xl">🌱</div>
                <p className="mt-2 font-semibold">
                  No upcoming events near you yet.
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
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-extrabold">
        {emoji} {title}
      </h2>
      <div className="scroll-rail flex gap-3 overflow-x-auto pb-2">
        {children}
      </div>
    </section>
  );
}
