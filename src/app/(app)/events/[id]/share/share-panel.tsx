"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Check, Copy, Link2, Share } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The host's ready-to-paste invite. The link goes on its own last line so
 * Discord and iMessage unfurl it into the preview card above.
 */
export function SharePanel({
  title,
  pitch,
  url,
}: {
  title: string;
  pitch: string;
  url: string;
}) {
  const [message, setMessage] = useState(`${pitch}\n${url}`);
  const [copied, setCopied] = useState<"message" | "link" | null>(null);
  // Only offer the system share sheet where one exists (phones, mostly).
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  async function copy(what: "message" | "link") {
    const text = what === "message" ? message : url;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt("Copy this", text);
    }
  }

  async function share() {
    try {
      // The message already ends with the link, so it isn't passed twice.
      await navigator.share({ title, text: message });
    } catch {
      // Dismissing the share sheet is fine.
    }
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Your invite</span>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-28"
          maxLength={600}
        />
      </label>

      <Button className="w-full" size="lg" onClick={() => copy("message")}>
        {copied === "message" ? (
          <>
            <Check className="size-5" /> Copied. Now paste it in Discord
          </>
        ) : (
          <>
            <Copy className="size-5" /> Copy invite
          </>
        )}
      </Button>

      <div className="flex gap-2">
        {canShare && (
          <Button variant="outline" className="flex-1" onClick={share}>
            <Share className="size-4" /> Share
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => copy("link")}
        >
          {copied === "link" ? (
            <>
              <Check className="size-4" /> Link copied
            </>
          ) : (
            <>
              <Link2 className="size-4" /> Copy link only
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
