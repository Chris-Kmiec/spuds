"use client";

import { saveOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY,
  GOALS,
  PLATFORMS,
  PLAY_STYLES,
  POPULAR_GAMES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { useState, useTransition } from "react";

const steps = [
  { key: "games", title: "What do you play?", hint: "Pick at least one — this powers your feed." },
  { key: "platforms", title: "Your platforms", hint: "Where do you play?" },
  { key: "style", title: "Your play style", hint: "How do you like your game nights?" },
  { key: "when", title: "When & why", hint: "When can you play, and what are you here for?" },
  { key: "location", title: "Where are you?", hint: "We use this to find events near you." },
] as const;

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function OnboardingWizard({ username }: { username: string }) {
  const [step, setStep] = useState(0);
  const [games, setGames] = useState<string[]>([]);
  const [customGame, setCustomGame] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canContinue = [
    games.length > 0,
    platforms.length > 0,
    styles.length > 0,
    availability.length > 0,
    location.trim().length > 0,
  ][step];

  function addCustomGame() {
    const g = customGame.trim();
    if (g && !games.includes(g)) setGames([...games, g]);
    setCustomGame("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (!location) setLocation("Near me");
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await saveOnboarding({
        favorite_games: games,
        platforms,
        play_styles: styles,
        availability,
        goals,
        location: location.trim(),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 py-8">
      {/* progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-spud-400" : "bg-soil-800/10"
            )}
          />
        ))}
      </div>

      <div className="flex-1 py-8">
        <p className="text-sm font-semibold text-spud-500">
          Hey {username} 👋 · Step {step + 1} of {steps.length}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black">
          {steps[step].title}
        </h1>
        <p className="mt-1 text-soil-800/60">{steps[step].hint}</p>

        <div className="mt-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[...new Set([...POPULAR_GAMES, ...games])].map((g) => (
                  <Chip
                    key={g}
                    selected={games.includes(g)}
                    onClick={() => setGames(toggle(games, g))}
                  >
                    {g}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customGame}
                  onChange={(e) => setCustomGame(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomGame();
                    }
                  }}
                  placeholder="Add another game…"
                />
                <Button type="button" variant="outline" onClick={addCustomGame}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
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
          )}

          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              {PLAY_STYLES.map((s) => (
                <Chip
                  key={s}
                  selected={styles.includes(s)}
                  onClick={() => setStyles(toggle(styles, s))}
                >
                  {s}
                </Chip>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-3 font-semibold">I can usually play…</h2>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY.map((a) => (
                    <Chip
                      key={a}
                      selected={availability.includes(a)}
                      onClick={() => setAvailability(toggle(availability, a))}
                    >
                      {a}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-3 font-semibold">I&apos;m here to…</h2>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <Chip
                      key={g}
                      selected={goals.includes(g)}
                      onClick={() => setGoals(toggle(goals, g))}
                    >
                      {g}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Neighborhood or city (e.g. Logan Square, Chicago)"
              />
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                disabled={locating}
              >
                <MapPin className="size-4" />
                {locating
                  ? "Locating…"
                  : coords
                    ? "Location captured ✓"
                    : "Use my precise location"}
              </Button>
              <p className="text-xs text-soil-800/50">
                Your exact location is never shown to other players — only
                rough distances to events.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-500">{error}</p>
        )}
      </div>

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
          <Button
            className="flex-1"
            disabled={!canContinue || pending}
            onClick={finish}
          >
            {pending ? "Setting up your feed…" : "Show me events 🎮"}
          </Button>
        )}
      </div>
    </div>
  );
}
