import { sendSpudsEmail, type SpudsEmail } from "@/lib/email";
import { NextResponse } from "next/server";

/**
 * Called by a Postgres trigger (pg_net) whenever a notification is created.
 * The database assembles the whole payload, so this route needs no elevated
 * Supabase access — it just authenticates the caller and sends the mail.
 */
export async function POST(request: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  if (request.headers.get("x-spuds-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: {
    to?: string;
    type?: string;
    unsubscribe_token?: string | null;
    party_title?: string;
    actor_name?: string;
    when?: string;
    link?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { to, type, unsubscribe_token } = payload;
  if (!to || !type) {
    return NextResponse.json({ error: "missing to/type" }, { status: 400 });
  }

  const link = payload.link ?? "https://getspuds.com";
  let email: SpudsEmail;

  switch (type) {
    case "waitlist_promoted":
      email = {
        kind: "waitlist_promoted",
        partyTitle: payload.party_title ?? "your party",
        when: payload.when ?? "",
        link,
      };
      break;
    case "new_rsvp":
      email = {
        kind: "new_rsvp",
        guestName: payload.actor_name ?? "Someone",
        partyTitle: payload.party_title ?? "your party",
        link,
      };
      break;
    case "new_review":
      email = {
        kind: "new_review",
        reviewerName: payload.actor_name ?? "Someone",
        link,
      };
      break;
    default:
      // Follows and anything else stay in-app only — email stays high-signal.
      return NextResponse.json({ skipped: type });
  }

  const result = await sendSpudsEmail(to, email, unsubscribe_token);
  return NextResponse.json(result, { status: result.sent ? 200 : 502 });
}
