"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SendHorizonal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function ChatRoom({
  conversationId,
  initialMessages,
  participants,
  me,
}: {
  conversationId: string;
  initialMessages: Message[];
  participants: Profile[];
  me: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const people = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: me, content })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]
      );
    } else if (error) {
      setDraft(content); // give the text back on failure
    }
    setSending(false);
  }

  return (
    <div className="chat-scroll flex flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="pt-12 text-center text-sm text-soil-800/50">
            No messages yet. Break the ice — game recommendations always work.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === me;
          const sender = people.get(m.sender_id);
          const showName =
            !mine && (i === 0 || messages[i - 1].sender_id !== m.sender_id);
          return (
            <div
              key={m.id}
              className={cn("flex gap-2", mine && "flex-row-reverse")}
            >
              {!mine && (
                <Avatar
                  src={sender?.avatar_url}
                  name={sender?.display_name ?? sender?.username ?? "Player"}
                  size="sm"
                  className={cn(!showName && "invisible")}
                />
              )}
              <div className={cn("max-w-[75%]", mine && "text-right")}>
                {showName && (
                  <p className="mb-0.5 pl-1 text-xs font-semibold text-soil-800/50">
                    {sender?.display_name ?? sender?.username ?? "Player"}
                  </p>
                )}
                <div
                  className={cn(
                    "inline-block rounded-2xl px-4 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-spud-400 text-white"
                      : "rounded-bl-md bg-white text-soil-800 shadow-sm"
                  )}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-soil-800/5 bg-cream-50 py-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message…"
          maxLength={4000}
        />
        <Button
          onClick={send}
          disabled={!draft.trim() || sending}
          aria-label="Send"
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
