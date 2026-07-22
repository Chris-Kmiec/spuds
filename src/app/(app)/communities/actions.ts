"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
}

export async function createCommunity(input: {
  name: string;
  description: string;
  games: string[];
  location: string;
  image_url: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const name = input.name.trim();
  if (name.length < 3) return { error: "Community name is too short." };

  const base = slugify(name);
  if (!base) return { error: "Try a name with letters or numbers." };

  // Avoid slug collisions
  const { data: existing } = await supabase
    .from("communities")
    .select("slug")
    .like("slug", `${base}%`);
  const taken = new Set((existing ?? []).map((r) => r.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

  const { error } = await supabase.from("communities").insert({
    creator_id: user.id,
    name,
    slug,
    description: input.description.trim() || null,
    games: input.games,
    location: input.location.trim() || null,
    image_url: input.image_url || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/communities");
  redirect(`/communities/${slug}`);
}

export async function joinCommunity(communityId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: user.id });

  if (error && error.code !== "23505") return { error: error.message };

  revalidatePath(`/communities/${slug}`);
  return {};
}

export async function leaveCommunity(communityId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/communities/${slug}`);
  return {};
}
