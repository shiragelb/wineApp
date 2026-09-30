import { NextResponse } from "next/server";
import { oauthCallbackUrlFromOrigin, safeNextPath } from "@/lib/auth-path";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function redirectWithError(origin: string, next: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("next", next);
  url.searchParams.set("error", "oauth");
  url.searchParams.set("error_description", message);
  return NextResponse.redirect(url);
}

function googleErrorMessage(raw: string) {
  if (/provider is not enabled|unsupported provider/i.test(raw)) {
    return "Google sign-in is not enabled on this project yet. Add a Google client ID in Supabase Auth.";
  }
  return raw || "Could not start Google sign-in.";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return redirectWithError(origin, next, "Supabase is not connected.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthCallbackUrlFromOrigin(origin, next),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return redirectWithError(origin, next, googleErrorMessage(error?.message ?? ""));
  }

  try {
    const probe = await fetch(data.url, { redirect: "manual" });
    if (probe.status >= 400) {
      const body = (await probe.json().catch(() => null)) as
        | { msg?: string; error_description?: string; message?: string }
        | null;
      return redirectWithError(
        origin,
        next,
        googleErrorMessage(
          body?.msg || body?.error_description || body?.message || `Google returned ${probe.status}.`
        )
      );
    }
  } catch {
    // If the probe fails, still send the browser to Google / Supabase.
  }

  return NextResponse.redirect(data.url);
}
