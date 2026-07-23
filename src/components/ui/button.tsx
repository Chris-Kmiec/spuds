import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

// No green button — pink is the only accent (see DESIGN.md).
type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-spud-400 text-white shadow-md shadow-spud-400/30 hover:bg-spud-500 active:scale-[0.98]",
  outline:
    "border-2 border-soil-800/15 bg-white text-soil-800 hover:border-spud-400 hover:text-spud-500",
  ghost: "text-soil-800/70 hover:bg-soil-800/5 hover:text-soil-800",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
