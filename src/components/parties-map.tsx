"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { CalendarDays, MapPin, Users, X } from "lucide-react";
import mapboxgl from "mapbox-gl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type MapParty = {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  timezone: string;
  location_name: string | null;
  image_url: string | null;
  type_label: string;
  event_type: string;
  games: string[];
  going: number;
  capacity: number;
  host_name: string;
  host_avatar: string | null;
};

/** Lucide paths, inlined so markers can be plain DOM nodes. */
const ICON_PATHS: Record<string, string> = {
  gaming_party: `<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>`,
  board_game: `<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>`,
  watch_party: `<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>`,
};

function markerSvg(eventType: string) {
  const paths = ICON_PATHS[eventType] ?? ICON_PATHS.gaming_party;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export function PartiesMap({
  parties,
  center,
  token,
}: {
  parties: MapParty[];
  center: { lat: number; lng: number };
  token: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, HTMLElement>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => parties.find((p) => p.id === selectedId) ?? null,
    [parties, selectedId]
  );

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center.lng, center.lat],
      zoom: 11,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    // Tapping empty map dismisses the sheet, like Zillow.
    map.on("click", () => setSelectedId(null));

    const located = parties.filter(
      (p) => p.latitude != null && p.longitude != null
    );
    const bounds = new mapboxgl.LngLatBounds();

    for (const p of located) {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", p.title);
      el.className = "spuds-marker";
      el.innerHTML = markerSvg(p.event_type);
      el.addEventListener("click", (e) => {
        e.stopPropagation(); // don't let the map's click clear it
        setSelectedId(p.id);
        // Nudge the pin up so the bottom sheet doesn't cover it.
        map.easeTo({
          center: [p.longitude!, p.latitude!],
          offset: [0, -70],
          duration: 350,
        });
      });

      markersRef.current.set(p.id, el);
      new mapboxgl.Marker({ element: el })
        .setLngLat([p.longitude!, p.latitude!])
        .addTo(map);
      bounds.extend([p.longitude!, p.latitude!]);
    }

    if (located.length === 1) {
      map.setCenter([located[0].longitude!, located[0].latitude!]);
      map.setZoom(13);
    } else if (located.length > 1) {
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [parties, center, token]);

  // Reflect selection on the pins themselves.
  useEffect(() => {
    markersRef.current.forEach((el, id) => {
      el.classList.toggle("is-selected", id === selectedId);
    });
  }, [selectedId]);

  if (!token) {
    return (
      <Card className="p-8 text-center text-soil-800/60">
        <p className="font-semibold">Map isn&apos;t configured yet.</p>
        <p className="mt-1 text-sm">
          Add a Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) to enable the map.
        </p>
      </Card>
    );
  }

  const spotsLeft = selected
    ? Math.max(0, selected.capacity - selected.going)
    : 0;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[62dvh] min-h-80 w-full overflow-hidden rounded-card border border-soil-800/5 shadow-sm shadow-soil-800/5"
      />

      {/* Detail sheet — always rises from the same spot */}
      {selected && (
        <div className="absolute inset-x-2 bottom-2 z-10 animate-[spuds-sheet_.18s_ease-out]">
          <Card className="relative overflow-hidden shadow-lg shadow-soil-800/15">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-soil-800/60 shadow-sm backdrop-blur transition-colors hover:text-soil-800"
            >
              <X className="size-4" />
            </button>

            <Link href={`/events/${selected.id}`} className="flex gap-3 p-3">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                {selected.image_url && (
                  <Image
                    src={selected.image_url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pr-6">
                <Badge>{selected.type_label}</Badge>
                <h3 className="mt-1 line-clamp-2 font-display text-base font-extrabold leading-snug">
                  {selected.title}
                </h3>

                <div className="mt-1 space-y-0.5 text-xs text-soil-800/70">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 shrink-0 text-soil-800/40" />
                    {formatEventDate(selected.start_time, selected.timezone)} ·{" "}
                    {formatEventTime(selected.start_time, selected.timezone)}
                  </div>
                  {selected.location_name && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-soil-800/40" />
                      <span className="truncate">{selected.location_name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-soil-800/5 pt-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-soil-800/70">
                    <Avatar
                      src={selected.host_avatar}
                      name={selected.host_name}
                      size="sm"
                    />
                    <span className="truncate">{selected.host_name}</span>
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1 text-xs font-bold ${
                      spotsLeft <= 2 ? "text-soil-800" : "text-sprout-600"
                    }`}
                  >
                    <Users className="size-3.5" />
                    {selected.going}/{selected.capacity}
                  </span>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
