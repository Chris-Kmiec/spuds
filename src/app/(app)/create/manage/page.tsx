import { CancelEventButton } from "./cancel-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Attendee, EventRow, Profile } from "@/lib/types";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { ArrowLeft, Pencil, Star } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Host dashboard" };

type HostedEvent = EventRow & {
  attendees: (Attendee & { profile: Profile })[];
};

export default async function HostDashboardPage() {
  const supabase = await createClient();
  const { userId } = await getCurrentProfile();

  const [{ data: eventsData }, { data: stats }] = await Promise.all([
    supabase
      .from("events")
      .select("*, attendees:event_attendees(*, profile:profiles(*))")
      .eq("host_id", userId!)
      .order("start_time", { ascending: false }),
    supabase
      .from("host_stats")
      .select("*")
      .eq("host_id", userId!)
      .maybeSingle(),
  ]);

  const events = (eventsData ?? []) as unknown as HostedEvent[];
  const upcoming = events.filter(
    (e) => e.status === "published" && new Date(e.start_time) > new Date()
  );
  const past = events.filter(
    (e) => e.status === "completed" || new Date(e.start_time) <= new Date()
  );

  const totalRsvps = events.reduce(
    (sum, e) => sum + e.attendees.filter((a) => a.status === "going").length,
    0
  );

  // Repeat attendees = players who joined 2+ of this host's events
  const attendeeCounts = new Map<string, number>();
  for (const e of events)
    for (const a of e.attendees)
      if (a.status === "going")
        attendeeCounts.set(a.user_id, (attendeeCounts.get(a.user_id) ?? 0) + 1);
  const repeatAttendees = [...attendeeCounts.values()].filter(
    (n) => n >= 2
  ).length;

  const avgRating = Number(stats?.avg_rating ?? 0);
  const reviewCount = Number(stats?.review_count ?? 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 pt-2">
        <Link
          href="/create"
          className="rounded-full bg-white p-2 shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black">Host dashboard</h1>
          <p className="text-sm text-soil-800/60">
            Your parties, your people, your numbers.
          </p>
        </div>
      </header>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Parties hosted" value={String(events.length)} />
        <StatCard label="Total RSVPs" value={String(totalRsvps)} />
        <StatCard
          label="Rating"
          value={
            reviewCount > 0
              ? `${avgRating.toFixed(1)} ★ (${reviewCount})`
              : "No reviews yet"
          }
        />
        <StatCard label="Repeat players" value={String(repeatAttendees)} />
      </div>

      <Section title="Upcoming" events={upcoming} showManage />
      <Section title="Past & completed" events={past} />

      {events.length === 0 && (
        <Card className="p-8 text-center text-soil-800/60">
          <div className="text-3xl">🎪</div>
          <p className="mt-2 font-semibold">You haven&apos;t hosted yet.</p>
          <p className="mt-1 text-sm">
            <Link href="/create" className="font-semibold text-spud-500">
              Create your first party
            </Link>{" "}
            — hosts are how scenes get started.
          </p>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-soil-800/50">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
    </Card>
  );
}

function Section({
  title,
  events,
  showManage = false,
}: {
  title: string;
  events: HostedEvent[];
  showManage?: boolean;
}) {
  if (events.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      {events.map((e) => {
        const going = e.attendees.filter((a) => a.status === "going");
        const waitlist = e.attendees.filter((a) => a.status === "waitlist");
        return (
          <Card key={e.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  href={`/events/${e.id}`}
                  className="font-display font-extrabold hover:text-spud-500"
                >
                  {e.title}
                </Link>
                <p className="text-sm text-soil-800/60">
                  {formatEventDate(e.start_time, e.timezone)} ·{" "}
                  {formatEventTime(e.start_time, e.timezone)}
                </p>
              </div>
              <Badge tone={e.status === "published" ? "positive" : "neutral"}>
                {e.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {going.length}/{e.capacity} going
                {waitlist.length > 0 && ` · ${waitlist.length} waitlisted`}
              </span>
              <span className="text-soil-800/50">
                {Math.round((going.length / e.capacity) * 100)}% full
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-soil-800/5">
              <div
                className="h-full rounded-full bg-sprout-400"
                style={{
                  width: `${Math.min(100, (going.length / e.capacity) * 100)}%`,
                }}
              />
            </div>

            {going.length > 0 && (
              <div className="space-y-2">
                {going.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <Avatar
                      src={a.profile.avatar_url}
                      name={a.profile.display_name ?? a.profile.username}
                      size="sm"
                    />
                    <span className="font-semibold">
                      {a.profile.display_name ?? a.profile.username}
                    </span>
                    {a.guests > 0 && <Badge>+{a.guests}</Badge>}
                    {a.message && (
                      <span className="truncate text-soil-800/60">
                        “{a.message}”
                      </span>
                    )}
                  </div>
                ))}
                {going.length > 6 && (
                  <p className="text-xs text-soil-800/50">
                    +{going.length - 6} more
                  </p>
                )}
              </div>
            )}

            {showManage && e.status === "published" && (
              <div className="flex items-center justify-end gap-1 border-t border-soil-800/5 pt-3">
                <Link href={`/events/${e.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="size-4" /> Edit
                  </Button>
                </Link>
                <CancelEventButton eventId={e.id} />
              </div>
            )}
          </Card>
        );
      })}
      {title === "Past & completed" && events.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-soil-800/50">
          <Star className="size-3.5" /> Attendees can review you after parties
          end — reviews power your host rating.
        </p>
      )}
    </section>
  );
}
