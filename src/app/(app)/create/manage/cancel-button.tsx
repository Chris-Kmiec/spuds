"use client";

import { cancelEvent } from "../actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CancelEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Cancel party
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-soil-800/60">Really cancel?</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Keep it
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await cancelEvent(eventId);
            router.refresh();
          })
        }
      >
        {pending ? "Cancelling…" : "Yes, cancel"}
      </Button>
    </div>
  );
}
