import { OnboardingWizard } from "./onboarding-wizard";
import { getCurrentProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export const metadata = { title: "Set up your gaming identity" };

export default async function OnboardingPage() {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile?.onboarded) redirect("/discover");

  return (
    <div className="min-h-dvh bg-cream-50">
      <OnboardingWizard username={profile?.username ?? "player"} />
    </div>
  );
}
