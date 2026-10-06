"use server";

import { createClient } from "@/lib/supabase/server";
import { NEXT_COOKIE, safeNext } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthState = { error?: string; message?: string };

/** Kick off Discord OAuth; Supabase sends the user back to /auth/callback. */
export async function signInWithDiscord(
  next?: string
): Promise<AuthState | void> {
  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ?? "https://getspuds.com";

  // Carried in a cookie rather than on redirectTo, so it can't trip
  // Supabase's redirect-URL allowlist.
  if (next) {
    (await cookies()).set(NEXT_COOKIE, safeNext(next), {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https"),
      maxAge: 60 * 10,
      path: "/",
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  if (data?.url) redirect(data.url);
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "");

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return {
      error:
        "Username must be 3–24 characters: lowercase letters, numbers, and underscores.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: username } },
  });

  if (error) return { error: error.message };

  if (!data.session) {
    return { message: "Check your email to confirm your account, then log in." };
  }

  revalidatePath("/", "layout");
  redirect(next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
