import { SharePanel } from "./share-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { invitePitch } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Share your party" };

/**
 * Where a host lands right after publishing, and can return to any time.
 * Parties fill when hosts post them in Discord and group chats, so this is
 * the moment to make that one tap.
 */
export default async function SharePartyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const justPublished = (await searchParams).new === "1";
  const { userId } = await getCurrentProfile();

  const supabase = await createClient();
  const { data: party } = await supabase
    .from("events")
    .select(
      "id, host_id, title, start_time, timezone, location_name, address, capacity, attendees:event_attendees(status)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!party) notFound();
  if (party.host_id !== userId) redirect(`/events/${id}`);

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const going = (party.attendees as { status: string }[]).filter(
    (a) => a.status === "going"
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3 pt-2">
        <Link
          href={`/events/${id}`}
          className="rounded-full bg-white p-2 shadow-sm"
          aria-label="Back to party"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="text-sm font-semibold text-soil-800/60">
          {party.title}
        </span>
      </header>

      <div className="text-center">
        {justPublished && <div className="text-5xl">🎉</div>}
        <h1 className="mt-3 font-display text-3xl font-black">
          {justPublished ? "Your party is live" : "Share your party"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-soil-800/60">
          Parties fill up when hosts share them. Drop the invite in your
          Discord server or group chat.
        </p>
      </div>

      <Card className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/events/${id}/share/preview`}
          alt="The preview card your link will show"
          width={1200}
          height={630}
          className="aspect-[1200/630] w-full bg-cream-200"
        />
        <p className="px-4 py-3 text-xs text-soil-800/50">
          What your friends see when you paste the link
        </p>
      </Card>

      <SharePanel
        title={party.title}
        pitch={invitePitch({ ...party, going })}
        url={`${origin}/events/${id}`}
      />

      <Link href={`/events/${id}`} className="block">
        <Button variant="ghost" className="w-full">
          View your party
        </Button>
      </Link>
    </div>
  );
}
