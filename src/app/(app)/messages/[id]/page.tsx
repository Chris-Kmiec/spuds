import { ChatRoom } from "./chat-room";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { EventRow, Message, Profile } from "@/lib/types";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { userId } = await getCurrentProfile();

  // RLS already restricts to participants; a null here means no access or bad id.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type, event:events(id, title, image_url, start_time, timezone)")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) notFound();

  const [{ data: messages }, { data: participantRows }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("conversation_participants")
      .select("profile:profiles(*)")
      .eq("conversation_id", id),
  ]);

  const participants = ((participantRows ?? []) as unknown as {
    profile: Profile;
  }[])
    .map((r) => r.profile)
    .filter(Boolean);

  const event = conversation.event as unknown as Pick<
    EventRow,
    "id" | "title" | "image_url" | "start_time" | "timezone"
  > | null;

  const title =
    conversation.type === "event"
      ? (event?.title ?? "Party chat")
      : participants
          .filter((p) => p.id !== userId)
          .map((p) => p.display_name ?? p.username)
          .join(", ") || "Direct message";

  return (
    <div className="chat-shell flex flex-col">
      <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-soil-800/5 bg-cream-50/95 px-4 py-3 backdrop-blur">
        <Link
          href="/messages"
          className="rounded-full bg-white p-2 shadow-sm"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display font-extrabold">{title}</h1>
          {event && (
            <Link
              href={`/events/${event.id}`}
              className="text-xs font-semibold text-spud-500"
            >
              {formatEventDate(event.start_time, event.timezone)} ·{" "}
              {formatEventTime(event.start_time, event.timezone)} · View party →
            </Link>
          )}
        </div>
      </header>

      <ChatRoom
        conversationId={id}
        initialMessages={(messages ?? []) as Message[]}
        participants={participants}
        me={userId!}
      />
    </div>
  );
}
