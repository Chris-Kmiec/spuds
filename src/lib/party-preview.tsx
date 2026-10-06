import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { partyIconSvg } from "@/lib/party-icons";
import {
  areaFromAddress,
  formatEventDate,
  formatEventTime,
  initials,
  timeZoneLabel,
} from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The card Discord, iMessage and group chats unfurl for a party link — the
 * first thing most people will ever see of Spuds. Same palette and type as
 * the app (DESIGN.md): cream canvas, ink text, pink only for the wordmark,
 * green only for good-news status.
 *
 * Rendered by the party's opengraph-image route (for crawlers) and by the
 * host's share screen (so they see exactly what their friends will).
 */

export const size = { width: 1200, height: 630 };

const INK = "#272727";
const ink = (a: number) => `rgba(39, 39, 39, ${a})`;
const PINK = "#ff6b8a";

type PreviewParty = {
  title: string;
  event_type: string;
  start_time: string;
  timezone: string;
  location_name: string | null;
  address: string | null;
  capacity: number;
  image_url: string | null;
  host: { display_name: string | null; username: string; avatar_url: string | null };
  attendees: { status: string }[];
};

function font(file: string) {
  return readFile(join(process.cwd(), "assets/og", file));
}

/** Satori only draws PNG and JPEG, so anything else (WebP uploads) is skipped. */
async function imageData(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/jpeg,image/png" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const png = buf[0] === 0x89 && buf[1] === 0x50;
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8;
    if (!png && !jpeg) return null;
    return `data:image/${png ? "png" : "jpeg"};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadPreviewParty(id: string) {
  // Anonymous on purpose: the preview must show exactly what the public sees.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase
    .from("events")
    .select(
      "title, event_type, start_time, timezone, location_name, address, capacity, image_url, host:profiles!events_host_id_fkey(display_name, username, avatar_url), attendees:event_attendees(status)"
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as PreviewParty | null) ?? null;
}

export async function renderPartyPreview(id: string) {
  const [party, nunito900, nunito800, inter400, inter600] = await Promise.all([
    loadPreviewParty(id),
    font("nunito-latin-900-normal.woff"),
    font("nunito-latin-800-normal.woff"),
    font("inter-latin-400-normal.woff"),
    font("inter-latin-600-normal.woff"),
  ]);
  const fonts = [
    { name: "Nunito", data: nunito900, weight: 900 as const },
    { name: "Nunito", data: nunito800, weight: 800 as const },
    { name: "Inter", data: inter400, weight: 400 as const },
    { name: "Inter", data: inter600, weight: 600 as const },
  ];

  if (!party) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 96,
            background: "#fff4dd",
            fontFamily: "Inter",
          }}
        >
          <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 56, color: PINK }}>
            Spuds
          </div>
          <div
            style={{
              marginTop: 24,
              fontFamily: "Nunito",
              fontWeight: 900,
              fontSize: 88,
              color: INK,
            }}
          >
            Find your player two.
          </div>
        </div>
      ),
      { ...size, fonts }
    );
  }

  const [cover, avatar] = await Promise.all([
    imageData(party.image_url),
    imageData(party.host.avatar_url),
  ]);

  const going = party.attendees.filter((a) => a.status === "going").length;
  const spotsLeft = Math.max(0, party.capacity - going);
  const hostName = party.host.display_name ?? party.host.username;
  const where = areaFromAddress(party.address) ?? party.location_name;
  const title =
    party.title.length > 70 ? `${party.title.slice(0, 68).trimEnd()}…` : party.title;
  const titleSize = title.length <= 28 ? 72 : title.length <= 48 ? 60 : 50;
  const iconSrc = (px: number, color: string, stroke = 2) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      partyIconSvg(party.event_type, { size: px, stroke: color, strokeWidth: stroke })
    )}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fffbf2",
          fontFamily: "Inter",
          color: INK,
        }}
      >
        {/* details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 740,
            padding: "56px 64px",
          }}
        >
          <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 40, color: PINK }}>
            Spuds
          </div>

          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: ink(0.05),
                  color: ink(0.7),
                  fontWeight: 600,
                  fontSize: 24,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc(26, ink(0.7), 2.25)} width={26} height={26} alt="" />
                {EVENT_TYPE_LABELS[party.event_type] ?? "Party"}
              </div>
            </div>
            <div
              style={{
                marginTop: 20,
                fontFamily: "Nunito",
                fontWeight: 900,
                fontSize: titleSize,
                lineHeight: 1.05,
              }}
            >
              {title}
            </div>
            <div style={{ marginTop: 24, fontWeight: 600, fontSize: 30, color: ink(0.8) }}>
              {`${formatEventDate(party.start_time, party.timezone)} · ${formatEventTime(party.start_time, party.timezone)} ${timeZoneLabel(party.start_time, party.timezone)}`}
            </div>
            {where && (
              <div style={{ marginTop: 6, fontSize: 28, color: ink(0.6) }}>{where}</div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  width={56}
                  height={56}
                  alt=""
                  style={{ borderRadius: 999, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background: "#ffe3ea",
                    color: "#d93a60",
                    fontFamily: "Nunito",
                    fontWeight: 800,
                    fontSize: 22,
                  }}
                >
                  {initials(hostName)}
                </div>
              )}
              <div style={{ display: "flex", fontSize: 26, color: ink(0.7) }}>
                Hosted by&nbsp;<span style={{ fontWeight: 600, color: INK }}>{hostName}</span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 24,
                background: spotsLeft > 0 ? "#e3f6e6" : ink(0.05),
                color: spotsLeft > 0 ? "#3ea54c" : ink(0.7),
              }}
            >
              {spotsLeft > 0
                ? `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
                : "Waitlist open"}
            </div>
          </div>
        </div>

        {/* cover, or the party type's icon when there's no usable photo */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} width={460} height={630} alt="" style={{ objectFit: "cover" }} />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 460,
              height: 630,
              background: "#f8e8c8",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc(200, ink(0.35), 1.5)} width={200} height={200} alt="" />
          </div>
        )}
      </div>
    ),
    { ...size, fonts }
  );
}
