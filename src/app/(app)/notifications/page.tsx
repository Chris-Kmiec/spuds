import { MarkAllRead } from "./mark-read";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, Star, Ticket, UserPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Notifications" };

const typeIcon = {
  waitlist_promoted: Ticket,
  new_rsvp: Ticket,
  new_review: Star,
  new_follow: UserPlus,
} as const;

export default async function NotificationsPage() {
  const { userId } = await getCurrentProfile();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(
      "*, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as unknown as Notification[];
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-4">
      {/* Clear the unread badge now that the inbox is open. */}
      <MarkAllRead hasUnread={hasUnread} />

      <header className="pt-2">
        <h1 className="font-display text-3xl font-black">Notifications</h1>
        <p className="text-soil-800/60">What you&apos;ve missed.</p>
      </header>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center text-soil-800/60">
          <Bell className="mx-auto size-8 text-spud-300" />
          <p className="mt-2 font-semibold">Nothing yet.</p>
          <p className="mt-1 text-sm">
            RSVPs, reviews, and new followers will show up here.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type];
            return (
              <Link key={n.id} href={n.link} className="block">
                <Card
                  className={cn(
                    "flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5",
                    !n.read && "bg-spud-50"
                  )}
                >
                  {n.actor ? (
                    <Avatar
                      src={n.actor.avatar_url}
                      name={n.actor.display_name ?? n.actor.username}
                      size="md"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sprout-100">
                      <Icon className="size-5 text-sprout-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-soil-800/90">{n.body}</p>
                    <p className="mt-0.5 text-xs text-soil-800/50">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="size-2.5 shrink-0 rounded-full bg-spud-400" />
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
