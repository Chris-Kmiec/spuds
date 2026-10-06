import { BottomNav } from "@/components/bottom-nav";
import { getCurrentProfile } from "@/lib/data";

/**
 * Pages anyone with a link can open. Signed-in players get the normal app
 * shell; visitors get the page alone, and each page offers its own way in.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await getCurrentProfile();

  return (
    <div className="min-h-dvh bg-cream-50">
      <main
        className={`mx-auto max-w-xl px-4 pt-4 ${userId ? "pb-nav" : "pb-safe"}`}
      >
        {children}
      </main>
      {userId && <BottomNav />}
    </div>
  );
}
