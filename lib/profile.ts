export type ProfileRow = {
  id?: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export const USERNAME_PATTERN = /^[a-zA-Z0-9._]{2,32}$/;
const NICK_PREFIX = "htnick:";
const NICK_PARAM = "htn";

export function isGeneratedUsername(username: string) {
  return /^user_[0-9a-f]{8}$/i.test(username);
}

export function nicknameFromAvatarUrl(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith(NICK_PREFIX)) {
    try {
      return decodeURIComponent(avatarUrl.slice(NICK_PREFIX.length)).trim() || null;
    } catch {
      return avatarUrl.slice(NICK_PREFIX.length).trim() || null;
    }
  }
  try {
    const parsed = new URL(avatarUrl);
    return parsed.searchParams.get(NICK_PARAM)?.trim() || null;
  } catch {
    return null;
  }
}

export function publicAvatarUrl(avatarUrl: string | null | undefined) {
  if (!avatarUrl || avatarUrl.startsWith(NICK_PREFIX)) return undefined;
  try {
    const parsed = new URL(avatarUrl);
    parsed.searchParams.delete(NICK_PARAM);
    return parsed.toString();
  } catch {
    return avatarUrl;
  }
}

export function embedNicknameInAvatarUrl(
  avatarUrl: string | null | undefined,
  nickname: string | null
) {
  const photo = publicAvatarUrl(avatarUrl) ?? null;
  const name = nickname?.trim() || null;
  if (!name) return photo;
  if (!photo) return `${NICK_PREFIX}${encodeURIComponent(name)}`;
  try {
    const parsed = new URL(photo);
    parsed.searchParams.set(NICK_PARAM, name);
    return parsed.toString();
  } catch {
    return photo;
  }
}

export function resolvedDisplayName(
  profile: Pick<ProfileRow, "display_name" | "avatar_url">
) {
  return profile.display_name?.trim() || nicknameFromAvatarUrl(profile.avatar_url);
}

export function profileTitle(
  profile: Pick<ProfileRow, "username" | "display_name"> & { avatar_url?: string | null }
) {
  const nickname = resolvedDisplayName({
    display_name: profile.display_name,
    avatar_url: profile.avatar_url ?? null,
  });
  if (nickname) return nickname;
  if (isGeneratedUsername(profile.username)) return "Wine guest";
  return profile.username;
}

export function profileHandle(profile: Pick<ProfileRow, "username">) {
  if (!profile.username || profile.username === "guest") return null;
  return `@${profile.username}`;
}

export function profileInitials(
  profile: Pick<ProfileRow, "username" | "display_name"> & { avatar_url?: string | null }
) {
  const source =
    resolvedDisplayName({
      display_name: profile.display_name,
      avatar_url: profile.avatar_url ?? null,
    }) || profile.username;
  const parts = source.replace(/^@/, "").split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
