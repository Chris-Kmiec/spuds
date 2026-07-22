"use client";

import { joinCommunity, leaveCommunity } from "../actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function JoinButton({
  communityId,
  slug,
  isMember,
  isOwner,
}: {
  communityId: string;
  slug: string;
  isMember: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (isOwner) {
    return (
      <Button variant="outline" disabled>
        You run this community
      </Button>
    );
  }

  return (
    <Button
      variant={isMember ? "outline" : "primary"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (isMember) await leaveCommunity(communityId, slug);
          else await joinCommunity(communityId, slug);
          router.refresh();
        })
      }
    >
      {pending ? "…" : isMember ? "Leave" : "Join community"}
    </Button>
  );
}
