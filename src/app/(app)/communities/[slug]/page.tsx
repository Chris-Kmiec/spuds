import { JoinButton } from "./join-button";
import { EventCard, type EventCardData } from "@/components/event-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Community, EventRow, Profile } from "@/lib/types";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { profile: viewer } = await getCurrentProfile();

  const { data: communityData } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!communityData) notFound();
  const community = communityData as Community;

  const [{ data: memberRows }, { data: eventsData }] = await Promise.all([
    supabase
      .from("community_members")
      .select("role, profile:profiles(*)")
      .eq("community_id", community.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("events")
      .select(
        "*, host:profiles!events_host_id_fkey(id, username, display_name, avatar_url), attendees:event_attendees(status)"
      )
      .eq("community_id", community.id)
      .eq("status", "published")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true }),
  ]);

  const members = ((memberRows ?? []) as unknown as {
    role: string;
    profile: Profile;
  }[]).filter((m) => m.profile);

  const events = ((eventsData ?? []) as unknown as (EventRow & {
    host: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
    attendees: { status: string }[];
  })[]).map(
    (e): EventCardData => ({
      ...e,
      going: e.attendees.filter((a) => a.status === "going").length,
    })
  );

  const isMember = members.some((m) => m.profile.id === viewer?.id);
  const isOwner = community.creator_id === viewer?.id;

  return (
    <div className="-mx-4 -mt-4 space-y-4 pb-4">
      <div className="relative h-44 bg-cream-200">
        {community.image_url && (
          <Image
            src={community.image_url}
            alt={community.name}
            fill
            sizes="640px"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
        <Link
          href="/communities"
          className="absolute left-4 top-4 rounded-full bg-white/90 p-2 shadow backdrop-blur"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="absolute bottom-4 left-4 right-4 font-display text-2xl font-black text-white drop-shadow">
          {community.name}
        </h1>
      </div>

      <div className="space-y-4 px-4">
        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-soil-800/70">
            <span className="flex items-center gap-1 font-semibold">
              <Users className="size-4" /> {members.length} members
            </span>
            {community.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {community.location}
              </span>
            )}
          </div>
          {community.description && (
            <p className="text-soil-800/80">{community.description}</p>
          )}
          {community.games.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {community.games.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>
          )}
          <JoinButton
            communityId={community.id}
            slug={community.slug}
            isMember={isMember}
            isOwner={isOwner}
          />
        </Card>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">
            Upcoming parties
          </h2>
          {events.length === 0 && (
            <Card className="p-6 text-center text-sm text-soil-800/60">
              Nothing scheduled yet.
              {isMember && (
                <>
                  {" "}
                  <Link
                    href="/create"
                    className="font-semibold text-spud-500"
                  >
                    Host one for the group →
                  </Link>
                </>
              )}
            </Card>
          )}
          {events.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              viewer={
                viewer
                  ? { latitude: viewer.latitude, longitude: viewer.longitude }
                  : null
              }
            />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">Members</h2>
          <Card className="flex flex-wrap gap-3 p-4">
            {members.map((m) => (
              <Link
                key={m.profile.id}
                href={`/profile/${m.profile.username}`}
                className="flex w-16 flex-col items-center gap-1 text-center"
              >
                <Avatar
                  src={m.profile.avatar_url}
                  name={m.profile.display_name ?? m.profile.username}
                />
                <span className="w-full truncate text-[11px] font-semibold text-soil-800/70">
                  {(m.profile.display_name ?? m.profile.username).split(" ")[0]}
                </span>
                {m.role !== "member" && (
                  <Badge className="px-1.5 py-0.5 text-[9px]">
                    {m.role}
                  </Badge>
                )}
              </Link>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
