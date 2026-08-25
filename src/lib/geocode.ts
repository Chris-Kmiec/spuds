/**
 * Turns a party's address into coordinates so it can appear on the map and
 * show a distance. Uses Mapbox's forward geocoder (same token as the map).
 *
 * BROWSER ONLY. The Mapbox token is URL-restricted to getspuds.com, which
 * Mapbox enforces via the Referer header — a server-side fetch has none and
 * gets 403. So the client geocodes and passes coordinates to the server
 * action, rather than the action looking them up itself.
 *
 * Deliberately forgiving: geocoding failure must never block publishing a
 * party — the party just won't have a pin until the address is fixed.
 */

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  /** What Mapbox matched, so a host can sanity-check the pin. */
  matched: string;
};

export async function geocodeAddress(
  address: string,
  venue?: string
): Promise<GeocodeResult | null> {
  if (!TOKEN) return null;

  // A venue name alone often geocodes better than a bare street address,
  // and together they disambiguate (e.g. two "Logan Arcade" listings).
  const query = [venue, address].filter(Boolean).join(", ").trim();
  if (query.length < 4) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${TOKEN}&limit=1&types=address,poi,place`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      features?: { center?: [number, number]; place_name?: string }[];
    };
    const hit = data.features?.[0];
    if (!hit?.center) return null;

    const [longitude, latitude] = hit.center;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude, matched: hit.place_name ?? query };
  } catch {
    // Network hiccup or timeout — publishing still succeeds.
    return null;
  }
}
