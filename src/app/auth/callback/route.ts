import { createClient } from "@/lib/supabase/server";
import { NEXT_COOKIE, safeNext } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const jar = await cookies();
  const next = safeNext(searchParams.get("next") ?? jar.get(NEXT_COOKIE)?.value);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.delete(NEXT_COOKIE);
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
