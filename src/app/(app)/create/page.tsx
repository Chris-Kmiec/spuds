import { EventWizard } from "./event-wizard";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Community } from "@/lib/types";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Host an event" };

export default async function CreatePage() {
  const supabase = await createClient();
  const { userId } = await getCurrentProfile();

  // Communities the user belongs to (to optionally host under)
  const { data: memberships } = await supabase
    .from("community_members")
    .select("community:communities(*)")
    .eq("user_id", userId!);

  const communities = (memberships ?? [])
    .map((m) => m.community as unknown as Community)
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/create/manage">
          <Button variant="outline" size="sm">
            <LayoutDashboard className="size-4" /> Host dashboard
          </Button>
        </Link>
      </div>
      <EventWizard communities={communities} />
    </div>
  );
}
