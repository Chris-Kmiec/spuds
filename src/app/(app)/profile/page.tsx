import { ProfileSettings } from "./edit-form";
import { EventCard, type EventCardData } from "@/components/event-card";
import { ProfileView } from "@/components/profile-view";
import { getCurrentProfile, getProfileViewData } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { EventRow, Profile } from "@/lib/types";
import { redirect } from "next/navigation";

export const metadata = { title: "Profile" };

export default async function MyProfilePage() {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login");

  const data = await getProfileViewData(profile.username);
  if (!data) redirect("/login");

  // Upcoming events I'm going to
  const supabase = await createClient();
  const { data: upcomingData } = await supabase
    .from("event_attendees")
    .select(
      "event:events(*, host:profiles!events_host_id_fkey(id, username, display_name, avatar_url), attendees:event_attendees(status))"
    )
    .eq("user_id", profile.id)
    .eq("status", "going");

  const upcoming = ((upcomingData ?? []) as unknown as {
    event: EventRow & {
      host: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
      attendees: { status: string }[];
    };
  }[])
    .map((r) => r.event)
    .filter(
      (e) =>
        e && e.status === "published" && new Date(e.start_time) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
    .map(
      (e): EventCardData => ({
        ...e,
        going: e.attendees.filter((a) => a.status === "going").length,
      })
    );

  return (
    <div className="space-y-4 pt-2">
      <ProfileView data={data} actions={<ProfileSettings profile={profile} />} />

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">
            Your upcoming parties
          </h2>
          {upcoming.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              viewer={{
                latitude: profile.latitude,
                longitude: profile.longitude,
              }}
            />
          ))}
        </section>
      )}
    </div>
  );
}
