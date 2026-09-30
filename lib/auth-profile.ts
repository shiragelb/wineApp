import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  embedNicknameInAvatarUrl,
  nicknameFromAvatarUrl,
  publicAvatarUrl,
} from "@/lib/profile";

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function oauthDisplayName(user: User) {
  const meta = user.user_metadata ?? {};
  const name = firstNonEmpty(
    meta.display_name,
    meta.full_name,
    meta.name,
    user.identities?.find((identity) => identity.provider === "google")?.identity_data
      ?.full_name as string | undefined,
    user.identities?.find((identity) => identity.provider === "google")?.identity_data
      ?.name as string | undefined
  );
  if (!name) return null;
  return name.slice(0, 48);
}

export function oauthAvatarUrl(user: User) {
  const meta = user.user_metadata ?? {};
  return firstNonEmpty(
    meta.avatar_url,
    meta.picture,
    user.identities?.find((identity) => identity.provider === "google")?.identity_data
      ?.avatar_url as string | undefined,
    user.identities?.find((identity) => identity.provider === "google")?.identity_data
      ?.picture as string | undefined
  );
}

export async function syncOAuthProfile(
  supabase: SupabaseClient,
  user: User
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return;

  const googleName = oauthDisplayName(user);
  const googlePhoto = oauthAvatarUrl(user);
  const existingNick =
    (typeof profile.display_name === "string" && profile.display_name.trim()) ||
    nicknameFromAvatarUrl(profile.avatar_url);
  const existingPhoto = publicAvatarUrl(profile.avatar_url);
  const nextNick = existingNick || googleName;
  const nextPhoto = existingPhoto || googlePhoto;

  if (!nextNick && !nextPhoto) return;
  if (existingNick && existingPhoto) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: nextNick,
      avatar_url: nextPhoto,
    })
    .eq("id", user.id);

  if (!error) return;
  if (!error.message.includes("display_name") && error.code !== "42703") return;

  await supabase
    .from("profiles")
    .update({
      avatar_url: embedNicknameInAvatarUrl(nextPhoto, nextNick),
    })
    .eq("id", user.id);
}
