"use client";

import { createCommunity } from "../actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/input";
import { DEFAULT_EVENT_IMAGES, POPULAR_GAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

export default function NewCommunityPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [games, setGames] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState(DEFAULT_EVENT_IMAGES[3]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3 pt-2">
        <Link
          href="/communities"
          className="rounded-full bg-white p-2 shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black">
            Start a community
          </h1>
          <p className="text-sm text-soil-800/60">
            For recurring crews: clubs, scenes, and squads.
          </p>
        </div>
      </header>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Community name — e.g. “Windy City Smash”"
        maxLength={60}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this community about? Who should join?"
        maxLength={1000}
      />
      <Input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Home base — neighborhood or city"
      />

      <div>
        <p className="mb-2 text-sm font-semibold">Games you play together</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_GAMES.slice(0, 14).map((g) => (
            <Chip
              key={g}
              selected={games.includes(g)}
              onClick={() =>
                setGames(
                  games.includes(g)
                    ? games.filter((x) => x !== g)
                    : [...games, g]
                )
              }
            >
              {g}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Banner image</p>
        <div className="grid grid-cols-3 gap-2">
          {DEFAULT_EVENT_IMAGES.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setImageUrl(url)}
              className={cn(
                "relative h-16 overflow-hidden rounded-xl border-4 transition-colors",
                imageUrl === url ? "border-spud-400" : "border-transparent"
              )}
            >
              <Image
                src={url}
                alt="Banner option"
                fill
                sizes="150px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <Button
        className="w-full"
        size="lg"
        disabled={name.trim().length < 3 || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createCommunity({
              name,
              description,
              games,
              location,
              image_url: imageUrl,
            });
            if (result?.error) setError(result.error);
          });
        }}
      >
        {pending ? "Creating…" : "Create community 🌱"}
      </Button>
    </div>
  );
}
