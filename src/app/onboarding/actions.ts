"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveOnboarding(input: {
  favorite_games: string[];
  platforms: string[];
  play_styles: string[];
  availability: string[];
  goals: string[];
  location: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: gpError } = await supabase.from("gaming_profiles").upsert(
    {
      user_id: user.id,
      favorite_games: input.favorite_games,
      platforms: input.platforms,
      play_styles: input.play_styles,
      availability: input.availability,
      goals: input.goals,
    },
    { onConflict: "user_id" }
  );
  if (gpError) return { error: gpError.message };

  const { error: pError } = await supabase
    .from("profiles")
    .update({
      location: input.location || null,
      latitude: input.latitude,
      longitude: input.longitude,
      onboarded: true,
    })
    .eq("id", user.id);
  if (pError) return { error: pError.message };

  revalidatePath("/", "layout");
  redirect("/discover");
}
