"use client";

import { startDm, toggleFollow } from "../actions";
import { Button } from "@/components/ui/button";
import { MessageCircle, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function PublicProfileActions({
  targetId,
  username,
  isFollowing,
}: {
  targetId: string;
  username: string;
  isFollowing: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-center gap-2">
      <Button
        variant={isFollowing ? "outline" : "primary"}
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleFollow(targetId, username);
            router.refresh();
          })
        }
      >
        {isFollowing ? (
          <>
            <UserMinus className="size-4" /> Following
          </>
        ) : (
          <>
            <UserPlus className="size-4" /> Follow
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await startDm(targetId);
          })
        }
      >
        <MessageCircle className="size-4" /> Message
      </Button>
    </div>
  );
}
