import { NextResponse } from "next/server";
import { syncOAuthProfile } from "@/lib/auth-profile";
import { safeNextPath } from "@/lib/auth-path";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function redirectWithError(origin: string, next: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("next", next);
  url.searchParams.set("error", "oauth");
  url.searchParams.set("error_description", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");

  if (oauthError) {
    return redirectWithError(
      origin,
      next,
      oauthDescription || "Google sign-in was cancelled."
    );
  }

  if (!isSupabaseConfigured()) {
    return redirectWithError(origin, next, "Supabase is not connected.");
  }

  if (!code) {
    return redirectWithError(
      origin,
      next,
      "Google sign-in didn't finish. Try again."
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectWithError(
      origin,
      next,
      error.message || "Google sign-in didn't finish. Try again."
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await syncOAuthProfile(supabase, user);
    } catch {
      // Profile sync is best-effort; the session is already established.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const destination = isLocalEnv
    ? `${origin}${next}`
    : forwardedHost
      ? `https://${forwardedHost}${next}`
      : `${origin}${next}`;

  return NextResponse.redirect(destination);
}
