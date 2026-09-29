import { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { CACHE_KEYS } from "@/lib/tickets";

export type FollowStats = {
  following: number;
  followers: number;
};

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
}

export function revalidateFollows(viewerId?: string, targetId?: string) {
  if (viewerId) {
    void globalMutate(CACHE_KEYS.following(viewerId));
    void globalMutate(CACHE_KEYS.followStats(viewerId));
    void globalMutate(CACHE_KEYS.discovery(viewerId));
  }
  if (targetId) {
    void globalMutate(CACHE_KEYS.followStats(targetId));
  }
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "discovery-feed",
    undefined,
    { revalidate: true }
  );
}
