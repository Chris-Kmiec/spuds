"use client";

import { createEvent } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input, Textarea } from "@/components/ui/input";
import {
  DEFAULT_EVENT_IMAGES,
  EVENT_TYPES,
  eventContentCopy,
  PLATFORMS,
} from "@/lib/constants";
import type { Community } from "@/lib/types";
import { cn, formatEventDate, formatEventTime, formatPrice } from "@/lib/utils";
import Image from "next/image";
import { useState, useTransition } from "react";

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function EventWizard({ communities }: { communities: Community[] }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(DEFAULT_EVENT_IMAGES[0]);
  const [usingUpload, setUsingUpload] = useState(false);
  const [eventType, setEventType] = useState<string>("gaming_party");
  // Games
  const [games, setGames] = useState<string[]>([]);
  const [customGame, setCustomGame] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  // Logistics
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [price, setPrice] = useState(0);
  const [communityId, setCommunityId] = useState<string | null>(null);
  // Details
  const [equipment, setEquipment] = useState("");
  const [rules, setRules] = useState("");

  const copy = eventContentCopy(eventType);
  const watching = eventType === "watch_party";
  const steps = ["Basics", copy.stepLabel, "Logistics", "Details", "Preview"];

  // Action-oriented subtext: tells the host what to do in this step.
  const stepSubtitles = [
    "Start with the basics — a name, the vibe, and a cover.",
    watching
      ? "Add the shows, movies, or matches you're screening."
      : "Add the games and platforms you'll play on.",
    "Set the date, location, price, and capacity.",
    watching
      ? "Add your setup notes and any house rules."
      : "Set who it's for, plus the gear and house rules.",
    "Give it a final look, then publish.",
  ];

  const startIso =
    date && startTime ? new Date(`${date}T${startTime}`).toISOString() : "";
  const endIso =
    date && endTime ? new Date(`${date}T${endTime}`).toISOString() : null;

  const canContinue = [
    title.trim().length >= 3,
    games.length > 0,
    !!date && !!startTime && locationName.trim().length > 0,
    true,
    true,
  ][step];

  function publish() {
    setError(null);
    startTransition(async () => {
      const result = await createEvent({
        title,
        description,
        image_url: imageUrl,
        event_type: eventType,
        games,
        platforms,
        start_time: startIso,
        end_time: endIso,
        location_name: locationName,
        address,
        capacity,
        price,
        skill_level: "all",
        equipment,
        rules,
        community_id: communityId,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-3xl font-black">Host an event</h1>
        <p className="text-soil-800/60">{stepSubtitles[step]}</p>
      </header>

      {/* step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-spud-400" : "bg-soil-800/10"
            )}
            aria-label={s}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-spud-500">
        Step {step + 1} · {steps[step]}
      </p>

      {step === 0 && (
        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title — e.g. “Mario Kart & Pizza Night”"
            maxLength={80}
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the vibe? What should people expect? Sell the night."
            maxLength={2000}
          />
          <div>
            <p className="mb-2 text-sm font-semibold">Event type</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  selected={eventType === t.value}
                  onClick={() => setEventType(t.value)}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Cover image</p>
            <ImageUpload
              bucket="event-images"
              value={usingUpload ? imageUrl : null}
              onUploaded={(url) => {
                setImageUrl(url);
                setUsingUpload(true);
              }}
              label="Upload your event photo"
            />
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-soil-800/50">
              Or pick one
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_EVENT_IMAGES.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setImageUrl(url);
                    setUsingUpload(false);
                  }}
                  className={cn(
                    "relative h-20 overflow-hidden rounded-xl border-4 transition-colors",
                    !usingUpload && imageUrl === url
                      ? "border-spud-400"
                      : "border-transparent"
                  )}
                >
                  <Image
                    src={url}
                    alt="Cover option"
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
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
                    const g = customGame.trim();
                    if (g && !games.includes(g)) setGames([...games, g]);
                    setCustomGame("");
                  }
                }}
                placeholder={copy.addPlaceholder}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const g = customGame.trim();
                  if (g && !games.includes(g)) setGames([...games, g]);
                  setCustomGame("");
                }}
              >
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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-semibold">Date</span>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold">Start</span>
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
          <Input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Venue name — e.g. “Logan Arcade” or “My place”"
          />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (you can share exact address after RSVP)"
          />
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
          {communities.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                Host under a community? (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  selected={communityId === null}
                  onClick={() => setCommunityId(null)}
                >
                  Just me
                </Chip>
                {communities.map((c) => (
                  <Chip
                    key={c.id}
                    selected={communityId === c.id}
                    onClick={() => setCommunityId(c.id)}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">Setup</p>
            <Textarea
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder={
                eventType === "watch_party"
                  ? "Setup — screen, sound, seating, snacks (e.g. “Projector + surround, BYO blanket, popcorn provided”)"
                  : "Equipment — what's provided, what to bring (e.g. “4 setups provided, BYO controller”)"
              }
            />
          </div>
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder={
              eventType === "watch_party"
                ? "House rules (optional) — spoiler policy, talking vs quiet, arrival time"
                : "House rules (optional) — rulesets, etiquette, vibes"
            }
          />
        </div>
      )}

      {step === 4 && (
        <Card className="overflow-hidden">
          <div className="relative h-40 bg-cream-200">
            <Image
              src={imageUrl}
              alt="Cover"
              fill
              sizes="640px"
              className="object-cover"
            />
          </div>
          <div className="space-y-3 p-5">
            <h2 className="font-display text-xl font-black">{title}</h2>
            <div className="flex flex-wrap gap-1.5">
              {games.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
              {platforms.map((p) => (
                <Badge key={p}>{p}</Badge>
              ))}
            </div>
            <p className="text-sm text-soil-800/70">
              {startIso &&
                `${formatEventDate(startIso)} · ${formatEventTime(startIso)}`}{" "}
              · {locationName} · {formatPrice(price)} · {capacity} spots
            </p>
            {description && (
              <p className="whitespace-pre-line text-sm text-soil-800/70">
                {description}
              </p>
            )}
            <p className="rounded-xl bg-cream-100 px-3 py-2 text-xs text-soil-800/60">
              Publishing creates your event chat automatically. You can cancel
              the event any time from your host dashboard.
            </p>
          </div>
        </Card>
      )}

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="flex gap-3 pb-4">
        {step > 0 && (
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={pending}
          >
            Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button
            className="flex-1"
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button className="flex-1" onClick={publish} disabled={pending}>
            {pending ? "Publishing…" : "Publish event"}
          </Button>
        )}
      </div>
    </div>
  );
}
