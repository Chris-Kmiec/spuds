"use client";

import { cn } from "@/lib/utils";
import { Check, Share } from "lucide-react";
import { useState } from "react";

/**
 * Opens the phone's share sheet where there is one (straight into Discord,
 * iMessage…), and copies the link everywhere else.
 */
export function ShareButton({
  path,
  title,
  className,
}: {
  path: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // Dismissing the sheet isn't a failure; anything else falls back.
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold shadow backdrop-blur",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="size-4" /> Link copied
        </>
      ) : (
        <>
          <Share className="size-4" /> Share
        </>
      )}
    </button>
  );
}
