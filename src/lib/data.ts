import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

import type { ProfileViewData } from "@/components/profile-view";

/** Current auth user + their profile, or nulls when signed out. */
export async function getCurrentProfile(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { userId: user.id, profile: (profile as Profile) ?? null };
}

/** Everything a profile page needs, by username. */
export async function getProfileViewData(
  username: string
): Promise<ProfileViewData | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return null;

  const [
    { data: gamingProfile },
    { count: eventsAttended },
    { count: eventsHosted },
    { count: followers },
    { data: reviews },
    { data: stats },
  ] = await Promise.all([
    supabase
      .from("gaming_profiles")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("event_attendees")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "going"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("host_id", profile.id)
      .in("status", ["published", "completed"]),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(*)")
      .eq("reviewed_user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("host_stats")
      .select("avg_rating")
      .eq("host_id", profile.id)
      .maybeSingle(),
  ]);

  return {
    profile: profile as Profile,
    gamingProfile: gamingProfile as ProfileViewData["gamingProfile"],
    eventsAttended: eventsAttended ?? 0,
    eventsHosted: eventsHosted ?? 0,
    followers: followers ?? 0,
    avgRating: Number(stats?.avg_rating ?? 0),
    reviews: (reviews ?? []) as ProfileViewData["reviews"],
  };
}
