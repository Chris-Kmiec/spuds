"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(input: {
  display_name: string;
  bio: string;
  location: string;
  avatar_url?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const patch: Record<string, string | null> = {
    display_name: input.display_name.trim() || null,
    bio: input.bio.trim() || null,
    location: input.location.trim() || null,
  };
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}

export async function toggleFollow(targetId: string, username: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetId });
  }

  revalidatePath(`/profile/${username}`);
  return {};
}

export async function startDm(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  if (targetId === user.id) return { error: "That's you!" };

  // Reuse an existing DM with this person if one exists
  const { data: myConvs } = await supabase
    .from("conversation_participants")
    .select("conversation_id, conversation:conversations(type)")
    .eq("user_id", user.id);

  const dmIds = (myConvs ?? [])
    .filter(
      (c) => (c.conversation as unknown as { type: string })?.type === "dm"
    )
    .map((c) => c.conversation_id);

  if (dmIds.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("conversation_id", dmIds)
      .eq("user_id", targetId)
      .limit(1);
    if (shared && shared.length > 0)
      redirect(`/messages/${shared[0].conversation_id}`);
  }

  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({ type: "dm" })
    .select("id")
    .single();
  if (convError) return { error: convError.message };

  // Insert self first so the participant policy lets us invite the other person
  const { error: selfError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, user_id: user.id });
  if (selfError) return { error: selfError.message };

  const { error: otherError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, user_id: targetId });
  if (otherError) return { error: otherError.message };

  redirect(`/messages/${conv.id}`);
}
