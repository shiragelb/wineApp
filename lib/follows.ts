import { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { resolvedDisplayName, type ProfileRow } from "@/lib/profile";
import { CACHE_KEYS } from "@/lib/tickets";

export type FollowStats = {
  following: number;
  followers: number;
};

function isMissingDisplayName(message: string) {
  return message.includes("display_name") || message.includes("schema cache");
}

function mapProfile(row: {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url: string | null;
}): ProfileRow {
  return {
    id: row.id,
    username: row.username,
    display_name: resolvedDisplayName({
      display_name: row.display_name ?? null,
      avatar_url: row.avatar_url,
    }),
    avatar_url: row.avatar_url,
  };
}

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.following_id);
}

export async function fetchFollowStats(userId: string): Promise<FollowStats> {
  const supabase = createClient();
  const [following, followers] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
  ]);

  if (following.error) throw new Error(following.error.message);
  if (followers.error) throw new Error(followers.error.message);

  return {
    following: following.count ?? 0,
    followers: followers.count ?? 0,
  };
}

export async function fetchProfilesByIds(ids: string[]): Promise<ProfileRow[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const full = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);

  if (!full.error) {
    return (full.data ?? []).map(mapProfile);
  }
  if (!isMissingDisplayName(full.error.message)) {
    throw new Error(full.error.message);
  }

  const fallback = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", ids);
  if (fallback.error) throw new Error(fallback.error.message);
  return (fallback.data ?? []).map((row) =>
    mapProfile({ ...row, display_name: null })
  );
}

export async function fetchFollowList(
  userId: string,
  kind: "followers" | "following"
): Promise<ProfileRow[]> {
  const supabase = createClient();
  const column = kind === "followers" ? "following_id" : "follower_id";
  const { data, error } = await supabase.from("follows").select("follower_id, following_id").eq(column, userId);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) =>
    kind === "followers" ? row.follower_id : row.following_id
  );
  const profiles = await fetchProfilesByIds(ids);
  const order = new Map(ids.map((id, index) => [id, index]));
  return [...profiles].sort(
    (left, right) => (order.get(left.id ?? "") ?? 0) - (order.get(right.id ?? "") ?? 0)
  );
}

function sanitizePeopleQuery(query: string) {
  return query.replace(/[^a-zA-Z0-9._\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchPeople(query: string): Promise<ProfileRow[]> {
  const supabase = createClient();
  const trimmed = sanitizePeopleQuery(query);
  let request = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .order("username")
    .limit(24);

  if (trimmed) {
    const pattern = `%${trimmed}%`;
    request = request.or(`username.ilike.${pattern},display_name.ilike.${pattern}`);
  }

  const first = await request;
  if (!first.error) {
    return (first.data ?? []).map(mapProfile);
  }
  if (!isMissingDisplayName(first.error.message)) {
    throw new Error(first.error.message);
  }

  let fallback = supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .order("username")
    .limit(24);
  if (trimmed) fallback = fallback.ilike("username", `%${trimmed}%`);
  const second = await fallback;
  if (second.error) throw new Error(second.error.message);
  return (second.data ?? []).map((row) => mapProfile({ ...row, display_name: null }));
}

async function requireViewerId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign in to follow people.");
  return data.user.id;
}

export async function followUser(followingId: string) {
  const followerId = await requireViewerId();
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  return followerId;
}

export async function unfollowUser(followingId: string) {
  const followerId = await requireViewerId();
  const supabase = createClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw new Error(error.message);
  return followerId;
}

export function patchFollowCaches(
  viewerId: string,
  targetId: string,
  nextFollowing: boolean
) {
  const delta = nextFollowing ? 1 : -1;

  void globalMutate(
    CACHE_KEYS.following(viewerId),
    (current: string[] | undefined) => {
      if (!current) return nextFollowing ? [targetId] : current;
      const ids = new Set(current);
      if (nextFollowing) ids.add(targetId);
      else ids.delete(targetId);
      return [...ids];
    },
    { revalidate: false }
  );

  void globalMutate(
    CACHE_KEYS.followStats(viewerId),
    (current: FollowStats | undefined) =>
      current
        ? { ...current, following: Math.max(0, current.following + delta) }
        : current,
    { revalidate: false }
  );

  void globalMutate(
    CACHE_KEYS.followStats(targetId),
    (current: FollowStats | undefined) =>
      current
        ? { ...current, followers: Math.max(0, current.followers + delta) }
        : current,
    { revalidate: false }
  );

  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "follow-list",
    undefined,
    { revalidate: true }
  );
}

export function revalidateFollows(viewerId?: string, targetId?: string) {
  if (viewerId) {
    void globalMutate(CACHE_KEYS.following(viewerId));
    void globalMutate(CACHE_KEYS.followStats(viewerId));
    void globalMutate(CACHE_KEYS.discovery(viewerId));
    void globalMutate(CACHE_KEYS.notifications(viewerId));
  }
  if (targetId) {
    void globalMutate(CACHE_KEYS.followStats(targetId));
  }
  void globalMutate(
    (key) => Array.isArray(key) && (key[0] === "discovery-feed" || key[0] === "follow-list"),
    undefined,
    { revalidate: true }
  );
}
