import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Community } from "@/lib/types";
import { Plus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Communities" };

type CommunityWithCount = Community & { members: { count: number }[] };

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const { userId } = await getCurrentProfile();

  const [{ data: communitiesData }, { data: myMemberships }] =
    await Promise.all([
      supabase
        .from("communities")
        .select("*, members:community_members(count)")
        .order("created_at", { ascending: true }),
      supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", userId!),
    ]);

  const communities = (communitiesData ?? []) as unknown as CommunityWithCount[];
  const mine = new Set((myMemberships ?? []).map((m) => m.community_id));

  const myCommunities = communities.filter((c) => mine.has(c.id));
  const discover = communities.filter((c) => !mine.has(c.id));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between pt-2">
        <div>
          <h1 className="font-display text-3xl font-black">Communities</h1>
          <p className="text-soil-800/60">
            Events make friends. Communities keep them.
          </p>
        </div>
        <Link href="/communities/new">
          <Button size="sm">
            <Plus className="size-4" /> Start one
          </Button>
        </Link>
      </header>

      {myCommunities.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">
            Your communities
          </h2>
          {myCommunities.map((c) => (
            <CommunityCard key={c.id} community={c} isMember />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold">
          {myCommunities.length > 0 ? "More to explore" : "Near you"}
        </h2>
        {discover.length === 0 && myCommunities.length === 0 && (
          <Card className="p-8 text-center text-soil-800/60">
            <div className="text-3xl">🏘️</div>
            <p className="mt-2 font-semibold">No communities yet.</p>
            <p className="mt-1 text-sm">
              <Link
                href="/communities/new"
                className="font-semibold text-spud-500"
              >
                Start the first one
              </Link>{" "}
              — every scene begins with a founder.
            </p>
          </Card>
        )}
        {discover.map((c) => (
          <CommunityCard key={c.id} community={c} />
        ))}
      </section>
    </div>
  );
}

function CommunityCard({
  community: c,
  isMember = false,
}: {
  community: CommunityWithCount;
  isMember?: boolean;
}) {
  return (
    <Link href={`/communities/${c.slug}`} className="block">
      <Card className="flex gap-3 overflow-hidden p-3 transition-transform hover:-translate-y-0.5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-cream-200">
          {c.image_url && (
            <Image
              src={c.image_url}
              alt={c.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display font-extrabold">{c.name}</h3>
            {isMember && <Badge tone="positive">Joined</Badge>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-soil-800/60">
            {c.description}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-soil-800/50">
            <Users className="size-3.5" />
            {c.members?.[0]?.count ?? 0} members
            {c.location && <> · {c.location.split(",")[0]}</>}
          </p>
        </div>
      </Card>
    </Link>
  );
}
