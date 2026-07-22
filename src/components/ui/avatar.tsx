import { cn, initials } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-24 text-2xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-spud-100 font-display font-bold text-spud-600 ring-2 ring-white",
        sizes[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
