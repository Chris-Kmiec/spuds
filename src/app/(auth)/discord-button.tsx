"use client";

import { signInWithDiscord } from "./actions";
import { useState, useTransition } from "react";

/** Discord's wordmark glyph — theirs, so it's inlined rather than lucide. */
function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      aria-hidden="true"
      className="size-5 fill-current"
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

export function DiscordButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await signInWithDiscord();
            if (result?.error) setError(result.error);
          })
        }
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#5865F2] px-6 text-sm font-semibold text-white shadow-md shadow-[#5865F2]/30 transition-colors hover:bg-[#4752C4] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <DiscordIcon />
        {pending ? "Opening Discord…" : label}
      </button>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
