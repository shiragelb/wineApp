const SEEN_KEY = "hang-notif-seen";

export function readSeenNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function markNotificationsSeen(ids: string[]) {
  if (typeof window === "undefined") return;
  const next = readSeenNotificationIds();
  for (const id of ids) next.add(id);
  window.localStorage.setItem(SEEN_KEY, JSON.stringify([...next].slice(-200)));
}
