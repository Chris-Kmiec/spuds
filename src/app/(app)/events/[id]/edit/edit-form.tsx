"use client";

import { editEvent } from "@/app/(app)/create/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input, Textarea } from "@/components/ui/input";
import { eventContentCopy, PLATFORMS } from "@/lib/constants";
import type { EventRow } from "@/lib/types";
import {
  DEFAULT_TZ,
  timeZoneLabel,
  utcToZonedFields,
  zonedToUtcIso,
} from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function EditEventForm({ event }: { event: EventRow }) {
  // Always edit in the party's own timezone, so a host in another zone
  // can't accidentally shift the start time just by opening this form.
  const tz = event.timezone || DEFAULT_TZ;
  const startFields = utcToZonedFields(event.start_time, tz);
  const endFields = utcToZonedFields(event.end_time, tz);
  const copy = eventContentCopy(event.event_type);
  const watching = event.event_type === "watch_party";
  const boardGame = event.event_type === "board_game";

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [imageUrl, setImageUrl] = useState(event.image_url ?? "");
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    event.image_url
  );
  const [games, setGames] = useState<string[]>(event.games);
  const [customGame, setCustomGame] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(event.platforms);
  const [date, setDate] = useState(startFields.date);
  const [startTime, setStartTime] = useState(startFields.time);
  const [endTime, setEndTime] = useState(endFields.time);
  const [locationName, setLocationName] = useState(event.location_name ?? "");
  const [address, setAddress] = useState(event.address ?? "");
  const [capacity, setCapacity] = useState(event.capacity);
  const [price, setPrice] = useState(Number(event.price));
  const [equipment, setEquipment] = useState(event.equipment ?? "");
  const [rules, setRules] = useState(event.rules ?? "");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addCustomGame() {
    const g = customGame.trim();
    if (g && !games.includes(g)) setGames([...games, g]);
    setCustomGame("");
  }

  function save() {
    setError(null);
    const startIso = date && startTime ? zonedToUtcIso(date, startTime, tz) : "";
    const endIso = date && endTime ? zonedToUtcIso(date, endTime, tz) : null;

    startTransition(async () => {
      const result = await editEvent(event.id, {
        title,
        description,
        image_url: imageUrl,
        games,
        platforms,
        start_time: startIso,
        end_time: endIso,
        location_name: locationName,
        address,
        capacity,
        price,
        equipment,
        rules,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3 pt-2">
        <Link
          href={`/events/${event.id}`}
          className="rounded-full bg-white p-2 shadow-sm"
          aria-label="Back to party"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-black">Edit party</h1>
          <p className="text-sm text-soil-800/60">
            Changes are visible to guests right away.
          </p>
        </div>
      </header>

      <label className="block space-y-1">
        <span className="text-sm font-semibold">Title</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold">Description</span>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-semibold">Cover image</p>
        <ImageUpload
          bucket="event-images"
          value={uploadedImage}
          onUploaded={(url) => {
            setImageUrl(url);
            setUploadedImage(url);
          }}
          label="Upload a new photo"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">{copy.question}</p>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...copy.suggestions, ...games])].map((g) => (
            <Chip
              key={g}
              selected={games.includes(g)}
              onClick={() => setGames(toggle(games, g))}
            >
              {g}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={customGame}
            onChange={(e) => setCustomGame(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomGame();
              }
            }}
            placeholder={copy.addPlaceholder}
          />
          <Button type="button" variant="outline" onClick={addCustomGame}>
            Add
          </Button>
        </div>
      </div>

      {copy.showPlatforms && (
        <div>
          <p className="mb-2 text-sm font-semibold">Platforms</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Chip
                key={p}
                selected={platforms.includes(p)}
                onClick={() => setPlatforms(toggle(platforms, p))}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm font-semibold">Date</span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold">
            Start{" "}
            <span className="font-normal text-soil-800/50">
              ({timeZoneLabel(event.start_time, tz)})
            </span>
          </span>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">End (optional)</span>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold">Venue</span>
        <Input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Address</span>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm font-semibold">Capacity</span>
          <Input
            type="number"
            min={2}
            max={200}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) || 2)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold">Price ($, 0 = free)</span>
          <Input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-semibold">
          {watching || boardGame ? "Setup" : "Equipment"}
        </span>
        <Textarea
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">House rules</span>
        <Textarea value={rules} onChange={(e) => setRules(e.target.value)} />
      </label>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="flex gap-3 pb-4">
        <Link href={`/events/${event.id}`} className="flex-1">
          <Button variant="ghost" className="w-full" disabled={pending}>
            Cancel
          </Button>
        </Link>
        <Button
          className="flex-1"
          onClick={save}
          disabled={pending || title.trim().length < 3 || games.length === 0}
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
