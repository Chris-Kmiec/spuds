import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EventRow, Profile } from "@/lib/types";
import {
  cn,
  distanceMiles,
  formatEventDate,
  formatEventTime,
  formatPrice,
} from "@/lib/utils";
import { CalendarDays, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type EventCardData = EventRow & {
  host: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  going: number;
  hostRating?: number | null;
};

const typeEmoji: Record<string, string> = {
  casual: "🛋️",
  tournament: "🏆",
  lan: "🖥️",
  club: "🎪",
  watch_party: "📺",
};

export function EventCard({
  event,
  viewer,
  layout = "list",
}: {
  event: EventCardData;
  viewer?: { latitude: number | null; longitude: number | null } | null;
  layout?: "list" | "rail";
}) {
  const distance =
    viewer?.latitude != null &&
    viewer?.longitude != null &&
    event.latitude != null &&
    event.longitude != null
      ? distanceMiles(
          viewer.latitude,
          viewer.longitude,
          event.latitude,
          event.longitude
        )
      : null;

  const spotsLeft = event.capacity - event.going;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn("block", layout === "rail" && "w-72 shrink-0")}
    >
      <Card className="overflow-hidden transition-transform hover:-translate-y-0.5">
        <div className="relative h-36 w-full bg-cream-200">
          {event.image_url && (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
            />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge tone="cream" className="bg-white/90 backdrop-blur">
              {typeEmoji[event.event_type]}{" "}
              {event.event_type === "watch_party"
                ? "watch party"
                : event.event_type}
            </Badge>
          </div>
          <div className="absolute right-3 top-3">
            <Badge
              tone={Number(event.price) === 0 ? "green" : "cream"}
              className="bg-white/90 backdrop-blur"
            >
              {formatPrice(event.price)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          <h3 className="line-clamp-2 font-display text-base font-extrabold leading-snug">
            {event.title}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {event.games.slice(0, 2).map((g) => (
              <Badge key={g} tone="pink">
                {g}
              </Badge>
            ))}
            {event.games.length > 2 && (
              <Badge tone="neutral">+{event.games.length - 2}</Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-soil-800/70">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-spud-400" />
              {formatEventDate(event.start_time)} ·{" "}
              {formatEventTime(event.start_time)}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-spud-400" />
              <span className="truncate">
                {event.location_name ?? "Location TBA"}
              </span>
              {distance != null && (
                <span className="shrink-0 text-soil-800/50">
                  · {distance.toFixed(1)} mi
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-soil-800/5 pt-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-soil-800/70">
              <Avatar
                src={event.host.avatar_url}
                name={event.host.display_name ?? event.host.username}
                size="sm"
              />
              <span className="truncate">
                {event.host.display_name ?? event.host.username}
              </span>
              {event.hostRating != null && event.hostRating > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {Number(event.hostRating).toFixed(1)}
                </span>
              )}
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-bold",
                spotsLeft <= 2 ? "text-spud-500" : "text-sprout-600"
              )}
            >
              <Users className="size-3.5" />
              {event.going}/{event.capacity}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
