"use client";

import { submitReview } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/input";
import { REVIEW_TAGS } from "@/lib/constants";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ReviewForm({
  eventId,
  hostId,
  hostName,
}: {
  eventId: string;
  hostId: string;
  hostName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <Card className="p-6 text-center">
        <div className="text-3xl">💚</div>
        <p className="mt-2 font-display font-extrabold">
          Thanks — your review helps the community grow.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-lg font-extrabold">
          How was {hostName}&apos;s event?
        </h2>
        <p className="text-sm text-soil-800/60">
          Reviews build trust for the whole community.
        </p>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            <Star
              className={`size-8 transition-colors ${
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-soil-800/20"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {REVIEW_TAGS.map((t) => (
          <Chip
            key={t}
            selected={tags.includes(t)}
            onClick={() =>
              setTags(
                tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]
              )
            }
          >
            {t}
          </Chip>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What should other players know?"
        maxLength={600}
      />

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <Button
        className="w-full"
        disabled={rating === 0 || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await submitReview(eventId, hostId, {
              rating,
              comment,
              tags,
            });
            if (result.error) setError(result.error);
            else {
              setDone(true);
              router.refresh();
            }
          });
        }}
      >
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </Card>
  );
}
