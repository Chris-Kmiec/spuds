import { Resend } from "resend";

const KEY = process.env.RESEND_API_KEY;
// Until getspuds.com is verified in Resend, their sandbox sender works.
const FROM = process.env.EMAIL_FROM ?? "Spuds <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getspuds.com";

const resend = KEY ? new Resend(KEY) : null;

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Branded shell. Inline styles only — email clients strip <style> blocks
 * and have no CSS variables.
 */
function layout({
  heading,
  body,
  ctaLabel,
  ctaHref,
  unsubscribeToken,
}: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  unsubscribeToken?: string | null;
}) {
  const unsub = unsubscribeToken
    ? `<p style="margin:24px 0 0;font-size:12px;color:#27272799">
         You're getting this because you use Spuds.
         <a href="${SITE}/unsubscribe?token=${unsubscribeToken}" style="color:#27272799">Unsubscribe</a>.
       </p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FFFBF2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF2;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td>
          <div style="font-size:24px;font-weight:800;color:#FF6B8A;letter-spacing:-.5px;">Spuds</div>
          <h1 style="margin:20px 0 8px;font-size:22px;line-height:1.25;color:#272727;font-weight:800;">${heading}</h1>
          <div style="font-size:15px;line-height:1.55;color:#272727cc;">${body}</div>
          <a href="${ctaHref}" style="display:inline-block;margin-top:24px;background:#FF6B8A;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:9999px;">${ctaLabel}</a>
          ${unsub}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export type SpudsEmail =
  | { kind: "waitlist_promoted"; partyTitle: string; when: string; link: string }
  | { kind: "new_rsvp"; guestName: string; partyTitle: string; link: string }
  | { kind: "new_review"; reviewerName: string; link: string }
  | { kind: "reminder"; partyTitle: string; when: string; where: string; link: string };

function render(e: SpudsEmail, token?: string | null) {
  switch (e.kind) {
    case "waitlist_promoted":
      return {
        subject: `You're in — ${e.partyTitle}`,
        html: layout({
          heading: "A spot opened up. You're in!",
          body: `Someone dropped out of <strong>${esc(e.partyTitle)}</strong>, so you've moved off the waitlist and you're confirmed.<br><br><strong>When:</strong> ${esc(e.when)}<br><br>The party chat is open to you now — say hi.`,
          ctaLabel: "See the party",
          ctaHref: e.link,
          unsubscribeToken: token,
        }),
      };
    case "new_rsvp":
      return {
        subject: `${e.guestName} is coming to ${e.partyTitle}`,
        html: layout({
          heading: `${esc(e.guestName)} just joined`,
          body: `Your party <strong>${esc(e.partyTitle)}</strong> has a new guest. You can see everyone who's coming, and message the group, from your party page.`,
          ctaLabel: "View guest list",
          ctaHref: e.link,
          unsubscribeToken: token,
        }),
      };
    case "new_review":
      return {
        subject: `${e.reviewerName} reviewed your party`,
        html: layout({
          heading: `${esc(e.reviewerName)} left you a review`,
          body: `Reviews build your host rating and help new players decide to show up. Take a look.`,
          ctaLabel: "Read the review",
          ctaHref: e.link,
          unsubscribeToken: token,
        }),
      };
    case "reminder":
      return {
        subject: `Tomorrow: ${e.partyTitle}`,
        html: layout({
          heading: "Your party is tomorrow",
          body: `<strong>${esc(e.partyTitle)}</strong><br><br><strong>When:</strong> ${esc(e.when)}<br><strong>Where:</strong> ${esc(e.where)}<br><br>Can't make it any more? Cancel your spot so someone on the waitlist can take it.`,
          ctaLabel: "View party details",
          ctaHref: e.link,
          unsubscribeToken: token,
        }),
      };
  }
}

/**
 * Sends a Spuds email. Silently no-ops when RESEND_API_KEY isn't set so
 * local dev and preview deploys never fail on a missing key.
 */
export async function sendSpudsEmail(
  to: string,
  email: SpudsEmail,
  unsubscribeToken?: string | null
): Promise<{ sent: boolean; error?: string }> {
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };

  const { subject, html } = render(email, unsubscribeToken);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}
