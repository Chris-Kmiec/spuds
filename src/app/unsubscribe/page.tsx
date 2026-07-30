import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Email preferences" };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let ok = false;
  if (token) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("unsubscribe_by_token", {
      p_token: token,
    });
    ok = data === true;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-100 p-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <span className="font-display text-3xl font-black text-spud-400">
          Spuds
        </span>
        <h1 className="mt-6 text-xl font-extrabold">
          {ok ? "You're unsubscribed" : "We couldn't find that link"}
        </h1>
        <p className="mt-2 text-sm text-soil-800/60">
          {ok
            ? "You won't get any more notification emails from Spuds. You'll still see everything in the app."
            : "That unsubscribe link looks expired or incomplete. You can manage email from your profile instead."}
        </p>
        <Link
          href="/discover"
          className="mt-6 inline-block font-semibold text-spud-500"
        >
          Back to Spuds
        </Link>
      </Card>
    </main>
  );
}
