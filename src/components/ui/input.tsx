import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-soil-800/10 bg-white px-4 text-sm text-soil-800 placeholder:text-soil-800/40 focus:border-spud-400 focus:outline-none focus:ring-2 focus:ring-spud-400/20",
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-soil-800/10 bg-white p-4 text-sm text-soil-800 placeholder:text-soil-800/40 focus:border-spud-400 focus:outline-none focus:ring-2 focus:ring-spud-400/20",
        className
      )}
      {...props}
    />
  );
});
