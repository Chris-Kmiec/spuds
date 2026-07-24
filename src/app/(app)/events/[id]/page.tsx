import { RsvpPanel } from "./rsvp-panel";
import { ReviewForm } from "./review-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { eventContentCopy, EVENT_TYPE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Attendee, EventRow, Profile, Review } from "@/lib/types";
import {
  formatEventDate,
  formatEventTime,
  formatPrice,
} from "@/lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Dices,
  Gamepad2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Ticket,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { profile: viewer } = await getCurrentProfile();

  const { data: eventData } = await supabase
    .from("events")
    .select(
      "*, host:profiles!events_host_id_fkey(*), attendees:event_attendees(*, profile:profiles(*))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!eventData) notFound();

  const event = eventData as unknown as EventRow & {
    host: Profile;
    attendees: (Attendee & { profile: Profile })[];
  };

  const going = event.attendees.filter((a) => a.status === "going");
  const spotsLeft = Math.max(0, event.capacity - going.length);
  const myRsvp = viewer
    ? (event.attendees.find((a) => a.user_id === viewer.id)?.status ?? null)
    : null;
  const isHost = viewer?.id === event.host_id;
  const isPast =
    event.status === "completed" ||
    new Date(event.end_time ?? event.start_time) < new Date();

  const [{ data: hostStats }, { data: hostReviews }, { data: conversation }, followsRes, myReviewRes] =
    await Promise.all([
      supabase
        .from("host_stats")
        .select("*")
        .eq("host_id", event.host_id)
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(*)")
        .eq("reviewed_user_id", event.host_id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("conversations")
        .select("id")
        .eq("event_id", event.id)
        .maybeSingle(),
      viewer
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", viewer.id)
        : Promise.resolve({ data: [] }),
      viewer
        ? supabase
            .from("reviews")
            .select("id")
            .eq("event_id", event.id)
            .eq("reviewer_id", viewer.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const iFollow = new Set(
    (followsRes.data ?? []).map((f: { following_id: string }) => f.following_id)
  );
  const friendsGoing = going.filter(
    (a) => iFollow.has(a.user_id) && a.user_id !== viewer?.id
  );
  const avgRating = Number(hostStats?.avg_rating ?? 0);
  const reviewCount = Number(hostStats?.review_count ?? 0);
  const canChat = isHost || myRsvp === "going";
  const canReview =
    isPast && !isHost && myRsvp === "going" && !myReviewRes.data;

  return (
    <div className="-mx-4 -mt-4 pb-28">
      {/* hero */}
      <div className="relative h-64 w-full bg-cream-200">
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
        <Link
          href="/discover"
          className="absolute left-4 top-4 rounded-full bg-white/90 p-2 shadow backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-2 flex gap-2">
            <Badge
              tone={Number(event.price) === 0 ? "positive" : "neutral"}
              className={Number(event.price) !== 0 ? "bg-white/90 text-soil-800/70" : undefined}
            >
              {formatPrice(event.price)}
            </Badge>
            <Badge className="bg-white/90 text-soil-800/70">
              {EVENT_TYPE_LABELS[event.event_type]}
            </Badge>
            {isPast && (
              <Badge className="bg-white/90 text-soil-800/70">Past party</Badge>
            )}
          </div>
          <h1 className="font-display text-2xl font-black text-white drop-shadow">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {/* when & where */}
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-soil-800/5 p-2.5">
              <CalendarDays className="size-5 text-soil-800/60" />
            </div>
            <div>
              <p className="font-semibold">
                {formatEventDate(event.start_time)}
              </p>
              <p className="text-sm text-soil-800/60">
                {formatEventTime(event.start_time)}
                {event.end_time && ` – ${formatEventTime(event.end_time)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-soil-800/5 p-2.5">
              <MapPin className="size-5 text-soil-800/60" />
            </div>
            <div>
              <p className="font-semibold">
                {event.location_name ?? "Location TBA"}
              </p>
              {event.address && (
                <p className="text-sm text-soil-800/60">{event.address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-soil-800/5 p-2.5">
              <Ticket className="size-5 text-soil-800/60" />
            </div>
            <div>
              <p className="font-semibold">
                {going.length} going · {spotsLeft} spots left
              </p>
              <p className="text-sm text-soil-800/60">
                Capacity {event.capacity}
              </p>
            </div>
          </div>
        </Card>

        {/* host / trust */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${event.host.username}`}>
              <Avatar
                src={event.host.avatar_url}
                name={event.host.display_name ?? event.host.username}
                size="lg"
              />
            </Link>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-soil-800/50">
                Hosted by
              </p>
              <Link
                href={`/profile/${event.host.username}`}
                className="font-display font-extrabold"
              >
                {event.host.display_name ?? event.host.username}
              </Link>
              <div className="flex items-center gap-2 text-sm text-soil-800/60">
                {reviewCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)} · {reviewCount}{" "}
                    {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                ) : (
                  <span>New host</span>
                )}
                <span className="flex items-center gap-1 text-sprout-600">
                  <ShieldCheck className="size-4" /> Verified email
                </span>
              </div>
            </div>
          </div>

          {hostReviews && hostReviews.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-soil-800/5 pt-4">
              {(hostReviews as unknown as (Review & { reviewer: Profile })[]).map(
                (r) => (
                  <div key={r.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={r.reviewer?.avatar_url}
                        name={r.reviewer?.display_name ?? "Player"}
                        size="sm"
                      />
                      <span className="font-semibold">
                        {r.reviewer?.display_name ?? r.reviewer?.username}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {r.rating}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-soil-800/70">{r.comment}</p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </Card>

        {/* description */}
        {event.description && (
          <Card className="p-5">
            <h2 className="mb-2 font-display text-lg font-extrabold">
              About this party
            </h2>
            <p className="whitespace-pre-line text-soil-800/80">
              {event.description}
            </p>
          </Card>
        )}

        {/* the experience */}
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold">
              {event.event_type === "watch_party" ? (
                <Clapperboard className="size-5 text-soil-800/40" />
              ) : event.event_type === "board_game" ? (
                <Dices className="size-5 text-soil-800/40" />
              ) : (
                <Gamepad2 className="size-5 text-soil-800/40" />
              )}{" "}
              {eventContentCopy(event.event_type).sectionTitle}
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.games.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
              {event.platforms.map((p) => (
                <Badge key={p}>{p}</Badge>
              ))}
            </div>
          </div>
          {event.equipment && (
            <div>
              <h3 className="mb-1 flex items-center gap-2 font-semibold">
                <Wrench className="size-4 text-soil-800/50" />{" "}
                {event.event_type === "watch_party" ||
                event.event_type === "board_game"
                  ? "Setup"
                  : "Equipment"}
              </h3>
              <p className="text-sm text-soil-800/70">{event.equipment}</p>
            </div>
          )}
          {event.rules && (
            <div>
              <h3 className="mb-1 font-semibold">House rules</h3>
              <p className="text-sm text-soil-800/70">{event.rules}</p>
            </div>
          )}
        </Card>

        {/* social proof */}
        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg font-extrabold">
            Who&apos;s going ({going.length})
          </h2>
          {friendsGoing.length > 0 && (
            <p className="mb-3 rounded-xl bg-sprout-100 px-3 py-2 text-sm font-semibold text-sprout-600">
              {friendsGoing
                .map((a) => a.profile.display_name ?? a.profile.username)
                .slice(0, 2)
                .join(" and ")}
              {friendsGoing.length > 2 && ` +${friendsGoing.length - 2} more`}{" "}
              you follow {friendsGoing.length === 1 ? "is" : "are"} going
            </p>
          )}
          {going.length === 0 ? (
            <p className="text-sm text-soil-800/60">
              Be the first to join — someone has to start the party.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {going.map((a) => (
                <Link
                  key={a.id}
                  href={`/profile/${a.profile.username}`}
                  className="flex w-16 flex-col items-center gap-1 text-center"
                >
                  <Avatar
                    src={a.profile.avatar_url}
                    name={a.profile.display_name ?? a.profile.username}
                  />
                  <span className="w-full truncate text-[11px] font-semibold text-soil-800/70">
                    {(a.profile.display_name ?? a.profile.username).split(" ")[0]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* event chat */}
        {canChat && conversation && (
          <Link href={`/messages/${conversation.id}`} className="block">
            <Button variant="outline" className="w-full">
              <MessageCircle className="size-4" /> Open party chat
            </Button>
          </Link>
        )}

        {/* review after the event */}
        {canReview && (
          <ReviewForm
            eventId={event.id}
            hostId={event.host_id}
            hostName={event.host.display_name ?? event.host.username}
          />
        )}
      </div>

      <RsvpPanel
        eventId={event.id}
        myStatus={myRsvp}
        spotsLeft={spotsLeft}
        isHost={isHost}
        isPast={isPast}
      />
    </div>
  );
}
