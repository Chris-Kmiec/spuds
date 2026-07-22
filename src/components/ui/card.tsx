import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-soil-800/5 bg-white shadow-sm shadow-soil-800/5",
        className
      )}
      {...props}
    />
  );
}
