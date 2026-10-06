"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function rsvp(
  eventId: string,
  input: { guests: number; message: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Capacity check → waitlist when full
  const [{ data: event }, { count: going }] = await Promise.all([
    supabase
      .from("events")
      .select("capacity, status, host_id")
      .eq("id", eventId)
      .single(),
    supabase
      .from("event_attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going"),
  ]);

  if (!event || event.status !== "published")
    return { error: "This party isn't open for RSVPs." };
  if (event.host_id === user.id)
    return { error: "You're the host — you're already going!" };

  const status = (going ?? 0) >= event.capacity ? "waitlist" : "going";

  const { error } = await supabase.from("event_attendees").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      status,
      guests: Math.max(0, Math.min(4, input.guests)),
      message: input.message.trim() || null,
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/messages");
  return { status };
}

export async function cancelRsvp(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("event_attendees")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  return {};
}

export async function submitReview(
  eventId: string,
  hostId: string,
  input: { rating: number; comment: string; tags: string[] }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("reviews").insert({
    reviewer_id: user.id,
    reviewed_user_id: hostId,
    event_id: eventId,
    rating: input.rating,
    comment: input.comment.trim() || null,
    tags: input.tags,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "You already reviewed this party." };
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return {};
}
