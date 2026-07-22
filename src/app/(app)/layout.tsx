import { BottomNav } from "@/components/bottom-nav";
import { getCurrentProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) redirect("/login");
  if (profile && !profile.onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-cream-50">
      <main className="mx-auto max-w-xl px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
