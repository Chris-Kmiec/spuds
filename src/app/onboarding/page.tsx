import { OnboardingWizard } from "./onboarding-wizard";
import { getCurrentProfile } from "@/lib/data";
import { safeNext } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = { title: "Set up your gaming identity" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Set when someone signed up from a shared party link.
  const next = safeNext((await searchParams).next);
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile?.onboarded) redirect(next);

  return (
    <div className="min-h-dvh bg-cream-50">
      <OnboardingWizard username={profile?.username ?? "player"} next={next} />
    </div>
  );
}
