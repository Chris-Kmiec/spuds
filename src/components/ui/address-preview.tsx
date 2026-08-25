"use client";

import { geocodeAddress } from "@/lib/geocode";
import { CircleAlert, LoaderCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "looking" }
  | { kind: "found"; matched: string }
  | { kind: "missing" };

/**
 * Confirms an address actually resolves to a point on the map, so a host
 * finds out while creating — not after nobody can find their party.
 */
export function AddressPreview({
  address,
  venue,
  onResolved,
}: {
  address: string;
  venue: string;
  /**
   * Reports the coordinates upward so the form can submit them. The token is
   * browser-only (see lib/geocode.ts), so this lookup is the one that counts.
   */
  onResolved?: (coords: { latitude: number; longitude: number } | null) => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const query = [venue, address].filter(Boolean).join(", ").trim();
    if (query.length < 6) {
      setState({ kind: "idle" });
      onResolved?.(null);
      return;
    }

    let cancelled = false;
    setState({ kind: "looking" });

    // Debounced so we don't geocode on every keystroke.
    const timer = setTimeout(async () => {
      const result = await geocodeAddress(address, venue);
      if (cancelled) return;
      setState(
        result ? { kind: "found", matched: result.matched } : { kind: "missing" }
      );
      onResolved?.(
        result
          ? { latitude: result.latitude, longitude: result.longitude }
          : null
      );
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // onResolved is intentionally excluded; callers pass an inline function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, venue]);

  if (state.kind === "idle") return null;

  if (state.kind === "looking") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-soil-800/50">
        <LoaderCircle className="size-3.5 animate-spin" />
        Finding this place…
      </p>
    );
  }

  if (state.kind === "missing") {
    return (
      <p className="flex items-start gap-1.5 text-xs text-soil-800/60">
        <CircleAlert className="mt-px size-3.5 shrink-0 text-soil-800/40" />
        We couldn&apos;t place this on the map. You can still publish — adding a
        street address and city helps people find you.
      </p>
    );
  }

  return (
    <p className="flex items-start gap-1.5 text-xs text-sprout-600">
      <MapPin className="mt-px size-3.5 shrink-0" />
      Found: {state.matched}
    </p>
  );
}
