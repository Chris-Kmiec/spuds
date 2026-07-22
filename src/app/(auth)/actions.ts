"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AuthState = { error?: string; message?: string };

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
  redirect(String(formData.get("next") || "/discover"));
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
  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
