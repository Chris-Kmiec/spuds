import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_TZ = "America/Chicago";

/**
 * A party happens at a place, so its times always read in the venue's own
 * timezone — never the viewer's. Pass the party's `timezone` column.
 */
export function formatEventDate(iso: string, tz: string = DEFAULT_TZ) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });
}

export function formatEventTime(iso: string, tz: string = DEFAULT_TZ) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
}

/** Short zone label (e.g. "CDT") so remote viewers aren't misled. */
export function timeZoneLabel(iso: string, tz: string = DEFAULT_TZ) {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  })
    .formatToParts(new Date(iso))
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "";
}

/** The viewer's zone differs from the party's — worth showing the label. */
export function viewerInDifferentZone(tz: string) {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone !== tz;
  } catch {
    return false;
  }
}

/** Offset (ms) of a timezone at a given instant. */
function tzOffsetMs(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return asUtc - date.getTime();
}

/** "2026-08-01" + "18:00" interpreted in `tz` → correct UTC instant. */
export function zonedToUtcIso(
  dateStr: string,
  timeStr: string,
  tz: string
): string {
  const naive = new Date(`${dateStr}T${timeStr}:00Z`);
  // Two passes so DST transitions resolve correctly.
  let utc = new Date(naive.getTime() - tzOffsetMs(naive, tz));
  utc = new Date(naive.getTime() - tzOffsetMs(utc, tz));
  return utc.toISOString();
}

/** A UTC instant → the date/time inputs a host should see for `tz`. */
export function utcToZonedFields(iso: string | null, tz: string) {
  if (!iso) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

export function formatPrice(price: number) {
  return Number(price) === 0 ? "Free" : `$${Number(price).toFixed(0)}`;
}

/** Rough distance in miles between two lat/lng points. */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * "City, ST" from a street address, for people who can see a party but not
 * its exact location (logged-out visitors, link previews). Returns null
 * rather than guess, so a street can never leak through.
 */
export function areaFromAddress(address: string | null | undefined) {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length && /^(united states|usa|us)$/i.test(parts.at(-1)!)) {
    parts.pop();
  }
  const stripZip = (s: string) => s.replace(/\s*\d{5}(-\d{4})?$/, "").trim();

  if (parts.length >= 3) {
    const state = stripZip(parts.at(-1)!);
    return state ? `${parts.at(-2)}, ${state}` : null;
  }
  // Already just "City, ST" — safe only if nothing looks like a street number.
  if (parts.length === 2 && !/\d/.test(parts[0])) {
    return `${parts[0]}, ${stripZip(parts[1])}`;
  }
  return null;
}

/**
 * The host's ready-to-paste invite, e.g. "Hosting Smash Night at Logan
 * Arcade. Thu, Oct 8 at 6:00 PM CDT. 28 spots open, come through!"
 * Names the venue or the city — never the street, since it goes public.
 */
export function invitePitch(party: {
  title: string;
  start_time: string;
  timezone: string;
  location_name: string | null;
  address: string | null;
  capacity: number;
  going: number;
}) {
  const where = party.location_name?.trim() || areaFromAddress(party.address);
  const when = `${formatEventDate(party.start_time, party.timezone)} at ${formatEventTime(party.start_time, party.timezone)} ${timeZoneLabel(party.start_time, party.timezone)}`;
  const spots = Math.max(0, party.capacity - party.going);
  const call =
    spots === 0
      ? "It's full, but the waitlist is open."
      : spots === 1
        ? "1 spot left, grab it!"
        : `${spots} spots open, come through!`;
  return `Hosting ${party.title}${where ? ` at ${where}` : ""}. ${when}. ${call}`;
}

/** Holds the post-OAuth destination across the Discord round trip. */
export const NEXT_COOKIE = "spuds_next";

/**
 * Where to send someone after auth. Only same-site paths — anything else
 * (absolute URLs, protocol-relative "//evil.com", backslash tricks) is an
 * open redirect, so it falls back.
 */
export function safeNext(
  value: string | null | undefined,
  fallback = "/discover"
) {
  if (
    !value ||
    !value.startsWith("/") ||
    /^\/[/\\]/.test(value) ||
    // Browsers drop tabs/newlines, so "/\t/evil.com" would become "//evil.com".
    /[\x00-\x1f]/.test(value)
  ) {
    return fallback;
  }
  return value;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
