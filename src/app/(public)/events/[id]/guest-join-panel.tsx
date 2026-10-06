import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * What a logged-out visitor sees instead of the RSVP panel. Joining sends
 * them through sign-up and onboarding, then straight back here with the
 * RSVP sheet already open.
 */
export function GuestJoinPanel({
  eventId,
  spotsLeft,
  isPast,
}: {
  eventId: string;
  spotsLeft: number;
  isPast: boolean;
}) {
  const next = encodeURIComponent(
    isPast ? "/discover" : `/events/${eventId}?join=1`
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-soil-800/5 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto max-w-xl space-y-2 text-center">
        <Link href={`/signup?next=${next}`} className="block">
          <Button className="w-full" size="lg">
            {isPast
              ? "Find parties near you"
              : spotsLeft > 0
                ? `Join this party · ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
                : "Join the waitlist"}
          </Button>
        </Link>
        <p className="text-xs text-soil-800/50">
          Free, and quick with Discord. Already on Spuds?{" "}
          <Link
            href={`/login?next=${next}`}
            className="font-semibold text-spud-500"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
