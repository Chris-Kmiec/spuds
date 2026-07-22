"use client";

import { signup, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useActionState } from "react";

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    {}
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-100 p-4">
      <Card className="w-full max-w-sm p-8">
        <Link
          href="/"
          className="font-display text-3xl font-black text-spud-400"
        >
          Spuds
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold">Join the party</h1>
        <p className="mt-1 text-sm text-soil-800/60">
          Find your people. IRL. One game at a time.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <Input
            name="username"
            placeholder="Username (e.g. couch_carl)"
            required
            minLength={3}
            maxLength={24}
          />
          <Input name="email" type="email" placeholder="Email" required />
          <Input
            name="password"
            type="password"
            placeholder="Password (8+ characters)"
            required
            minLength={8}
          />
          {state.error && (
            <p className="text-sm font-medium text-red-500">{state.error}</p>
          )}
          {state.message && (
            <p className="text-sm font-medium text-sprout-600">
              {state.message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-soil-800/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-spud-500">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
