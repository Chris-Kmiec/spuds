import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

// Two tones only (see DESIGN.md): neutral for metadata, positive for good-news status.
type Tone = "neutral" | "positive";

const tones: Record<Tone, string> = {
  neutral: "bg-soil-800/5 text-soil-800/70",
  positive: "bg-sprout-100 text-sprout-600",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
