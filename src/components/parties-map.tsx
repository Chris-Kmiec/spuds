"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { formatEventDate } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

export type MapParty = {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  location_name: string | null;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

    const located = parties.filter(
      (p) => p.latitude != null && p.longitude != null
    );
    const bounds = new mapboxgl.LngLatBounds();

    for (const p of located) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:9999px;background:#FF6B8A;border:3px solid #fff;box-shadow:0 1px 5px rgba(39,39,39,.35);cursor:pointer;";

      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
      }).setHTML(
        `<a href="/events/${p.id}" style="font-weight:800;color:#272727;text-decoration:none;font-family:inherit">${escapeHtml(
          p.title
        )}</a><div style="color:#27272799;font-size:12px;margin-top:2px">${formatEventDate(
          p.start_time
        )}${p.location_name ? " · " + escapeHtml(p.location_name) : ""}</div>`
      );

      new mapboxgl.Marker({ element: el })
        .setLngLat([p.longitude!, p.latitude!])
        .setPopup(popup)
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
    };
  }, [parties, center, token]);

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

  return (
    <div
      ref={containerRef}
      className="h-[68vh] w-full overflow-hidden rounded-card border border-soil-800/5 shadow-sm shadow-soil-800/5"
    />
  );
}
