import { createClient } from "@/lib/supabase/server";
import type { Attendee, EventRow, Profile } from "@/lib/types";
import {
  areaFromAddress,
  formatEventDate,
  formatEventTime,
  timeZoneLabel,
} from "@/lib/utils";
import { cache } from "react";

export type PartyWithPeople = EventRow & {
  host: Profile;
  attendees: (Attendee & { profile: Profile })[];
};

/** One query per request, shared by the page and its link-preview metadata. */
export const loadParty = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "*, host:profiles!events_host_id_fkey(*), attendees:event_attendees(*, profile:profiles(*))"
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as PartyWithPeople | null) ?? null;
});

/**
 * The one-line pitch a link preview shows under the title, e.g.
 * "Sat, Oct 4 · 6:00 PM CDT · Chicago, IL · 3 spots left · Hosted by Petey".
 * Uses the area, never the street — previews are fully public.
 */
export function describeParty(event: PartyWithPeople) {
  const going = event.attendees.filter((a) => a.status === "going").length;
  const spotsLeft = Math.max(0, event.capacity - going);
  const host = event.host.display_name ?? event.host.username;
  return [
    formatEventDate(event.start_time, event.timezone),
    `${formatEventTime(event.start_time, event.timezone)} ${timeZoneLabel(event.start_time, event.timezone)}`,
    areaFromAddress(event.address) ?? event.location_name,
    spotsLeft > 0
      ? `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
      : "Waitlist open",
    `Hosted by ${host}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
