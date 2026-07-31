import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { EventRow, Message, Profile } from "@/lib/types";
import { formatEventDate } from "@/lib/utils";
import { Gamepad2, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Messages" };

type ConvRow = {
  conversation: {
    id: string;
    type: "event" | "dm";
    event: Pick<
      EventRow,
      "id" | "title" | "image_url" | "start_time" | "timezone"
    > | null;
  };
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const { userId } = await getCurrentProfile();

  const { data: rows } = await supabase
    .from("conversation_participants")
    .select(
      "conversation:conversations(id, type, event:events(id, title, image_url, start_time, timezone))"
    )
    .eq("user_id", userId!);

  const conversations = ((rows ?? []) as unknown as ConvRow[])
    .map((r) => r.conversation)
    .filter(Boolean);

  const convIds = conversations.map((c) => c.id);

  // Latest message per conversation + participants for DM naming
  const [{ data: lastMessages }, { data: participants }] = await Promise.all([
    convIds.length
      ? supabase
          .from("messages")
          .select("conversation_id, content, created_at, sender:profiles(username, display_name)")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    convIds.length
      ? supabase
          .from("conversation_participants")
          .select("conversation_id, profile:profiles(id, username, display_name, avatar_url)")
          .in("conversation_id", convIds)
      : Promise.resolve({ data: [] }),
  ]);

  const latest = new Map<
    string,
    { content: string; created_at: string; sender: { display_name: string | null; username: string } }
  >();
  for (const m of (lastMessages ?? []) as unknown as (Message & {
    sender: Profile;
  })[]) {
    if (!latest.has(m.conversation_id)) latest.set(m.conversation_id, m as never);
  }

  const others = new Map<string, Profile[]>();
  for (const p of (participants ?? []) as unknown as {
    conversation_id: string;
    profile: Profile;
  }[]) {
    if (p.profile.id === userId) continue;
    others.set(p.conversation_id, [
      ...(others.get(p.conversation_id) ?? []),
      p.profile,
    ]);
  }

  const sorted = conversations.sort((a, b) => {
    const la = latest.get(a.id)?.created_at ?? "";
    const lb = latest.get(b.id)?.created_at ?? "";
    return lb.localeCompare(la);
  });

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="font-display text-3xl font-black">Messages</h1>
        <p className="text-soil-800/60">
          Party chats open automatically when you RSVP.
        </p>
      </header>

      {sorted.length === 0 && (
        <Card className="p-8 text-center text-soil-800/60">
          <MessageCircle className="mx-auto size-8 text-spud-300" />
          <p className="mt-2 font-semibold">No conversations yet.</p>
          <p className="mt-1 text-sm">
            <Link href="/discover" className="font-semibold text-spud-500">
              Join a party
            </Link>{" "}
            and its chat will show up here.
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {sorted.map((c) => {
          const last = latest.get(c.id);
          const otherPeople = others.get(c.id) ?? [];
          const title =
            c.type === "event"
              ? (c.event?.title ?? "Party chat")
              : otherPeople
                  .map((p) => p.display_name ?? p.username)
                  .join(", ") || "Direct message";

          return (
            <Link key={c.id} href={`/messages/${c.id}`} className="block">
              <Card className="flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
                {c.type === "dm" && otherPeople[0] ? (
                  <Avatar
                    src={otherPeople[0].avatar_url}
                    name={otherPeople[0].display_name ?? otherPeople[0].username}
                    size="lg"
                  />
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-soil-800/5">
                    <Gamepad2 className="size-6 text-soil-800/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-display font-extrabold">
                      {title}
                    </p>
                    {c.type === "event" && c.event && (
                      <span className="shrink-0 text-xs text-soil-800/50">
                        {formatEventDate(c.event.start_time, c.event.timezone)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-soil-800/60">
                    {last
                      ? `${last.sender?.display_name?.split(" ")[0] ?? last.sender?.username ?? "Player"}: ${last.content}`
                      : "Say hi"}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
