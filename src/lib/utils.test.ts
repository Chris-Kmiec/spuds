import { describe, expect, it } from "vitest";
import { badgesFor } from "./constants";
import {
  distanceMiles,
  formatEventDate,
  formatEventTime,
  formatPrice,
  initials,
  timeZoneLabel,
  utcToZonedFields,
  zonedToUtcIso,
} from "./utils";

/**
 * Timezone handling is the easiest thing here to break without noticing:
 * a party must read at its venue's local time for every viewer, and editing
 * one must never silently shift it.
 */
describe("party timezones", () => {
  it("round-trips wall-clock time through UTC", () => {
    const cases = [
      ["2026-08-01", "18:00", "America/Chicago"], // CDT
      ["2026-01-15", "19:30", "America/Chicago"], // CST
      ["2026-08-01", "20:00", "America/New_York"],
      ["2026-08-01", "20:00", "Europe/London"],
      ["2026-08-01", "19:00", "Asia/Tokyo"],
    ] as const;

    for (const [date, time, tz] of cases) {
      const iso = zonedToUtcIso(date, time, tz);
      expect(utcToZonedFields(iso, tz)).toEqual({ date, time });
    }
  });

  it("survives both DST boundaries", () => {
    // Spring forward and fall back in US Central.
    for (const [date, time] of [
      ["2026-03-08", "03:00"],
      ["2026-11-01", "01:30"],
    ] as const) {
      const iso = zonedToUtcIso(date, time, "America/Chicago");
      expect(utcToZonedFields(iso, "America/Chicago")).toEqual({ date, time });
    }
  });

  it("shows the venue's local time regardless of the viewer", () => {
    // 6pm in Chicago stays 6pm for everyone.
    const iso = zonedToUtcIso("2026-08-01", "18:00", "America/Chicago");
    expect(formatEventTime(iso, "America/Chicago")).toBe("6:00 PM");
    expect(formatEventDate(iso, "America/Chicago")).toBe("Sat, Aug 1");
  });

  it("labels the zone so remote viewers aren't misled", () => {
    const summer = zonedToUtcIso("2026-08-01", "18:00", "America/Chicago");
    const winter = zonedToUtcIso("2026-01-15", "18:00", "America/Chicago");
    expect(timeZoneLabel(summer, "America/Chicago")).toBe("CDT");
    expect(timeZoneLabel(winter, "America/Chicago")).toBe("CST");
  });

  it("defaults to Chicago when a party has no timezone", () => {
    const iso = zonedToUtcIso("2026-08-01", "18:00", "America/Chicago");
    expect(formatEventTime(iso)).toBe("6:00 PM");
  });

  it("returns empty fields for a missing end time", () => {
    expect(utcToZonedFields(null, "America/Chicago")).toEqual({
      date: "",
      time: "",
    });
  });
});

describe("formatPrice", () => {
  it("says Free rather than $0 so browsing doesn't lead with cost", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("drops cents", () => {
    expect(formatPrice(15)).toBe("$15");
    expect(formatPrice(5.4)).toBe("$5");
  });
});

describe("distanceMiles", () => {
  it("measures a known Chicago hop", () => {
    // Logan Square -> Uptown is roughly 5 miles.
    const d = distanceMiles(41.923, -87.7099, 41.9665, -87.6533);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(6);
  });

  it("is zero for the same point", () => {
    expect(distanceMiles(41.9, -87.6, 41.9, -87.6)).toBeCloseTo(0);
  });
});

describe("reputation badges", () => {
  it("gives nothing to a brand-new player", () => {
    expect(badgesFor({ eventsHosted: 0, eventsAttended: 0 })).toEqual([]);
  });

  it("unlocks First Host on the first party", () => {
    const labels = badgesFor({ eventsHosted: 1, eventsAttended: 0 }).map(
      (b) => b.label
    );
    expect(labels).toContain("First Host");
  });

  it("stacks as a host grows", () => {
    const labels = badgesFor({ eventsHosted: 10, eventsAttended: 5 }).map(
      (b) => b.label
    );
    expect(labels).toEqual([
      "First Host",
      "Community Builder",
      "Tournament Organizer",
      "Regular Player",
    ]);
  });
});

describe("initials", () => {
  it("uses at most two letters", () => {
    expect(initials("Pete Alvarez")).toBe("PA");
    expect(initials("Dana")).toBe("D");
    expect(initials("a b c d")).toBe("AB");
  });
});
