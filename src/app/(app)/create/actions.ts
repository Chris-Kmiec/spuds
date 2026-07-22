"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type NewEventInput = {
  title: string;
  description: string;
  image_url: string;
  event_type: string;
  games: string[];
  platforms: string[];
  start_time: string; // ISO
  end_time: string | null;
  location_name: string;
  address: string;
  capacity: number;
  price: number;
  skill_level: string;
  equipment: string;
  rules: string;
  community_id: string | null;
};

export async function createEvent(input: NewEventInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (!input.title.trim()) return { error: "Give your event a title." };
  if (input.games.length === 0) return { error: "Pick at least one game." };
  if (!input.start_time) return { error: "Pick a date and time." };
  if (new Date(input.start_time) < new Date())
    return { error: "Start time must be in the future." };

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      image_url: input.image_url || null,
      event_type: input.event_type,
      games: input.games,
      platforms: input.platforms,
      start_time: input.start_time,
      end_time: input.end_time,
      location_name: input.location_name.trim() || null,
      address: input.address.trim() || null,
      capacity: Math.max(2, Math.min(200, input.capacity)),
      price: Math.max(0, input.price),
      skill_level: input.skill_level,
      equipment: input.equipment.trim() || null,
      rules: input.rules.trim() || null,
      community_id: input.community_id,
      status: "published",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/discover");
  redirect(`/events/${data.id}`);
}

export async function cancelEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/create/manage");
  revalidatePath("/discover");
  return {};
}
