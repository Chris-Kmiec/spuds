"use client";

import { cn } from "@/lib/utils";

/** Selectable pill used in onboarding and filters. */
export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all active:scale-95",
        selected
          ? "border-spud-400 bg-spud-400 text-white shadow-md shadow-spud-400/25"
          : "border-soil-800/10 bg-white text-soil-800/70 hover:border-spud-300",
        className
      )}
    >
      {children}
    </button>
  );
}
