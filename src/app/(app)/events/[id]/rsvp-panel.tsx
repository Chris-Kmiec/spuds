"use client";

import { cancelRsvp, rsvp } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RsvpPanel({
  eventId,
  myStatus,
  spotsLeft,
  isHost,
  isPast,
}: {
  eventId: string;
  myStatus: "going" | "waitlist" | "cancelled" | null;
  spotsLeft: number;
  isHost: boolean;
  isPast: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isPast) return null;

  if (isHost) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-soil-800/5 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => router.push("/create/manage")}
          >
            Manage your event
          </Button>
        </div>
      </div>
    );
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await rsvp(eventId, { guests, message });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      await cancelRsvp(eventId);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-soil-800/5 bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-xl space-y-3">
        {myStatus === "going" || myStatus === "waitlist" ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-display font-extrabold text-sprout-600">
                {myStatus === "going"
                  ? "You're going!"
                  : "You're on the waitlist"}
              </p>
              <p className="text-xs text-soil-800/60">
                {myStatus === "going"
                  ? "The event chat is open for you."
                  : "We'll bump you in if a spot opens up."}
              </p>
            </div>
            <Button variant="outline" onClick={cancel} disabled={pending}>
              {pending ? "…" : "Can't make it"}
            </Button>
          </div>
        ) : !open ? (
          <Button className="w-full" size="lg" onClick={() => setOpen(true)}>
            {spotsLeft > 0
              ? `Join this event · ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
              : "Join waitlist"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-sm font-semibold">
                Bringing anyone?
              </p>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGuests(n)}
                    className={`h-10 flex-1 rounded-full border-2 text-sm font-bold transition-colors ${
                      guests === n
                        ? "border-spud-400 bg-spud-400 text-white"
                        : "border-soil-800/10 text-soil-800/70"
                    }`}
                  >
                    {n === 0 ? "Just me" : `+${n}`}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say hi to the host (optional) — e.g. “First timer, I main Kirby”"
              className="min-h-16"
              maxLength={280}
            />
            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={confirm} disabled={pending}>
                {pending ? "Confirming…" : "Confirm RSVP"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
