import { PublicProfileActions } from "./profile-actions";
import { ProfileView } from "@/components/profile-view";
import { getCurrentProfile, getProfileViewData } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { profile: viewer } = await getCurrentProfile();

  if (viewer?.username === username) redirect("/profile");

  const data = await getProfileViewData(username);
  if (!data) notFound();

  const supabase = await createClient();
  const { data: followRow } = viewer
    ? await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("following_id", data.profile.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-4 pt-2">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm font-semibold text-soil-800/60"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      <ProfileView
        data={data}
        actions={
          viewer ? (
            <PublicProfileActions
              targetId={data.profile.id}
              username={username}
              isFollowing={!!followRow}
            />
          ) : null
        }
      />
    </div>
  );
}
