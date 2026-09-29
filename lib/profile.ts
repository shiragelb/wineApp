export type ProfileRow = {
  id?: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export const USERNAME_PATTERN = /^[a-zA-Z0-9._]{2,32}$/;

export function isGeneratedUsername(username: string) {
  return /^user_[0-9a-f]{8}$/i.test(username);
}

export function slugFromDisplayName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 32);
  return USERNAME_PATTERN.test(slug) ? slug : null;
}

export function profileTitle(profile: Pick<ProfileRow, "username" | "display_name">) {
  const nickname = profile.display_name?.trim();
  if (nickname) return nickname;
  if (isGeneratedUsername(profile.username)) return "Wine guest";
  return profile.username;
}

export function profileHandle(profile: Pick<ProfileRow, "username" | "display_name">) {
  const nickname = profile.display_name?.trim();
  if (nickname) return `@${profile.username}`;
  return null;
}

export function profileInitials(profile: Pick<ProfileRow, "username" | "display_name">) {
  const source = profile.display_name?.trim() || profile.username;
  const parts = source.replace(/^@/, "").split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
