import { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { CACHE_KEYS } from "@/lib/tickets";

function storageKey(userId: string) {
  return `hang-mutes:${userId}`;
}

function readLocalMutes(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeLocalMutes(userId: string, ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(ids));
}

function isMissingMutesTable(message: string) {
  return (
    message.includes("mutes") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

export async function fetchMutedIds(userId: string): Promise<string[]> {
  const local = readLocalMutes(userId);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mutes")
    .select("muted_id")
    .eq("muter_id", userId);

  if (error) {
    if (isMissingMutesTable(error.message)) return local;
    throw new Error(error.message);
  }

  const fromDb = (data ?? []).map((row) => row.muted_id);
  const merged = [...new Set([...fromDb, ...local])];
  writeLocalMutes(userId, merged);
  return merged;
}

export async function muteUser(mutedId: string) {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!data.user) throw new Error("Sign in to mute someone.");
  const muterId = data.user.id;
  if (muterId === mutedId) throw new Error("You cannot mute yourself.");

  const next = [...new Set([...readLocalMutes(muterId), mutedId])];
  writeLocalMutes(muterId, next);

  const { error } = await supabase.from("mutes").insert({
    muter_id: muterId,
    muted_id: mutedId,
  });
  if (error && error.code !== "23505" && !isMissingMutesTable(error.message)) {
    throw new Error(error.message);
  }

  return muterId;
}

export async function unmuteUser(mutedId: string) {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!data.user) throw new Error("Sign in to unmute someone.");
  const muterId = data.user.id;
  writeLocalMutes(
    muterId,
    readLocalMutes(muterId).filter((id) => id !== mutedId)
  );

  const { error } = await supabase
    .from("mutes")
    .delete()
    .eq("muter_id", muterId)
    .eq("muted_id", mutedId);
  if (error && !isMissingMutesTable(error.message)) {
    throw new Error(error.message);
  }

  return muterId;
}

export function patchMuteCaches(viewerId: string, targetId: string, muted: boolean) {
  void globalMutate(
    CACHE_KEYS.mutes(viewerId),
    (current: string[] | undefined) => {
      const ids = new Set(current ?? readLocalMutes(viewerId));
      if (muted) ids.add(targetId);
      else ids.delete(targetId);
      const next = [...ids];
      writeLocalMutes(viewerId, next);
      return next;
    },
    { revalidate: false }
  );
}

export function revalidateMutes(viewerId?: string) {
  if (viewerId) void globalMutate(CACHE_KEYS.mutes(viewerId));
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "discovery-feed",
    undefined,
    { revalidate: true }
  );
}
