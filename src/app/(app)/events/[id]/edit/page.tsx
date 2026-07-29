import { EditEventForm } from "./edit-form";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Edit party" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await getCurrentProfile();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();
  // Only the host can edit; everyone else goes back to the party.
  if (event.host_id !== userId) redirect(`/events/${id}`);

  return <EditEventForm event={event as EventRow} />;
}
