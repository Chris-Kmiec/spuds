"use client";

import { login, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

function LoginForm() {
  const search = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    {}
  );

  return (
    <Card className="w-full max-w-sm p-8">
      <Link href="/" className="font-display text-3xl font-black text-spud-400">
        Spuds
      </Link>
      <h1 className="mt-6 text-2xl font-extrabold">Welcome back</h1>
      <p className="mt-1 text-sm text-soil-800/60">
        Your player two has been waiting.
      </p>

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={search.get("next") ?? ""} />
        <Input name="email" type="email" placeholder="Email" required />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        {state.error && (
          <p className="text-sm font-medium text-red-500">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-soil-800/60">
        New to Spuds?{" "}
        <Link href="/signup" className="font-semibold text-spud-500">
          Create an account
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-100 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
