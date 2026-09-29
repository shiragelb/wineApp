export type ProfileRow = {
  id?: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function isGeneratedUsername(username: string) {
  return /^user_[0-9a-f]{8}$/i.test(username);
}

export function profileTitle(profile: Pick<ProfileRow, "username" | "display_name">) {
  const nickname = profile.display_name?.trim();
  if (nickname) return nickname;
  if (isGeneratedUsername(profile.username)) return "Wine guest";
  return `@${profile.username}`;
}

export function profileHandle(profile: Pick<ProfileRow, "username" | "display_name">) {
  const nickname = profile.display_name?.trim();
  if (nickname || !isGeneratedUsername(profile.username)) {
    return `@${profile.username}`;
  }
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
