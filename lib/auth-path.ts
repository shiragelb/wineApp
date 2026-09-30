export function safeNextPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export function withNextPath(href: string, nextPath?: string | null) {
  const next = safeNextPath(nextPath);
  if (next === "/") return href;
  return `${href}?next=${encodeURIComponent(next)}`;
}

export function oauthCallbackUrl(nextPath?: string | null) {
  const origin = window.location.origin;
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNextPath(nextPath));
  return url.toString();
}

export function oauthErrorMessage(error?: string | null, description?: string | null) {
  const code = (error ?? "").trim();
  const detail = (description ?? "").trim();

  if (!code && !detail) return null;
  if (code === "access_denied") {
    return "Google sign-in was cancelled.";
  }
  if (code === "oauth") {
    return detail || "Google sign-in didn't finish. Try again.";
  }
  return detail || "Could not complete sign-in. Try again.";
}
