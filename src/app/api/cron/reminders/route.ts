import { sendSpudsEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Emails a reminder to everyone attending a party that starts in the next
 * ~24-48h. Idempotent: party_reminders records each send, so re-running
 * (or a retry) never emails the same person twice for the same party.
 *
 * Invoked by Vercel Cron, which sends CRON_SECRET as a bearer token.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 503 }
    );
  }

  // Service role: reminders run with no user session and must read emails.
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const { data: parties, error } = await supabase
    .from("events")
    .select(
      "id, title, start_time, location_name, attendees:event_attendees(user_id, status)"
    )
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .lte("start_time", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const party of parties ?? []) {
    const going = (party.attendees ?? []).filter(
      (a: { status: string }) => a.status === "going"
    );
    if (going.length === 0) continue;

    const userIds = going.map((a: { user_id: string }) => a.user_id);

    const [{ data: profiles }, { data: alreadySent }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email_opt_in, unsubscribe_token")
        .in("id", userIds),
      supabase
        .from("party_reminders")
        .select("user_id")
        .eq("event_id", party.id),
    ]);

    const done = new Set((alreadySent ?? []).map((r) => r.user_id));
    const when = new Date(party.start_time).toLocaleString("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    for (const profile of profiles ?? []) {
      if (done.has(profile.id) || !profile.email_opt_in) {
        skipped++;
        continue;
      }

      const { data: userRes } = await supabase.auth.admin.getUserById(
        profile.id
      );
      const to = userRes?.user?.email;
      if (!to) {
        skipped++;
        continue;
      }

      const result = await sendSpudsEmail(
        to,
        {
          kind: "reminder",
          partyTitle: party.title,
          when,
          where: party.location_name ?? "See party details",
          link: `https://getspuds.com/events/${party.id}`,
        },
        profile.unsubscribe_token
      );

      if (result.sent) {
        await supabase
          .from("party_reminders")
          .insert({ event_id: party.id, user_id: profile.id });
        sent++;
      } else {
        skipped++;
      }
    }
  }

  return NextResponse.json({ parties: parties?.length ?? 0, sent, skipped });
}
