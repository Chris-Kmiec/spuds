import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { MapPin, PartyPopper, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/discover");

  return (
    <main className="min-h-dvh bg-cream-100">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl font-black text-spud-400">
            Spuds
          </span>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <div className="mb-6 text-5xl">🥔</div>
          <h1 className="font-display text-5xl font-black leading-tight text-soil-800">
            Find your <span className="text-spud-400">player two</span>.
          </h1>
          <p className="mt-4 max-w-md text-lg text-soil-800/70">
            Spuds helps gamers build real-world friendships through shared
            gaming experiences. Discover parties near you, meet your people,
            and host nights they&apos;ll come back for.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                I have an account
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 text-center text-sm font-semibold text-soil-800/70">
            <div className="rounded-card bg-white p-4 shadow-sm">
              <MapPin className="mx-auto size-6 text-spud-400" />
              <div className="mt-2">Discover parties nearby</div>
            </div>
            <div className="rounded-card bg-white p-4 shadow-sm">
              <Users className="mx-auto size-6 text-spud-400" />
              <div className="mt-2">Meet trusted players</div>
            </div>
            <div className="rounded-card bg-white p-4 shadow-sm">
              <PartyPopper className="mx-auto size-6 text-spud-400" />
              <div className="mt-2">Host your own nights</div>
            </div>
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-soil-800/40">
          getspuds.com · Discover → Attend → Connect → Return → Host
        </footer>
      </div>
    </main>
  );
}
