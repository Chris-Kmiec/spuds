import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "pink" | "green" | "cream" | "neutral";

const tones: Record<Tone, string> = {
  pink: "bg-spud-100 text-spud-600",
  green: "bg-sprout-100 text-sprout-600",
  cream: "bg-cream-100 text-soil-800/80",
  neutral: "bg-soil-800/5 text-soil-800/70",
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
