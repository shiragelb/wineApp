"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ProfileRow } from "@/lib/profile";
import {
  CACHE_KEYS,
  mapTicketRow,
  hangTicketSelect,
  hangTicketSelectFallback,
  type CanonicalWine,
  type HangTicketView,
  type TicketRow,
} from "@/lib/tickets";

function isMissingDisplayName(message: string) {
  return message.includes("display_name") || message.includes("schema cache");
}

export async function fetchTickets(userId?: string): Promise<HangTicketView[]> {
  const supabase = createClient();
  let query = supabase
    .from("hang_tickets")
    .select(hangTicketSelect)
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const first = await query;
  if (!first.error) {
    return ((first.data ?? []) as unknown as TicketRow[]).map(mapTicketRow);
  }

  if (!isMissingDisplayName(first.error.message)) {
    throw new Error(first.error.message);
  }

  let fallbackQuery = supabase
    .from("hang_tickets")
    .select(hangTicketSelectFallback)
    .order("created_at", { ascending: false });

  if (userId) {
    fallbackQuery = fallbackQuery.eq("user_id", userId);
  }

  const fallback = await fallbackQuery;
  if (fallback.error) throw new Error(fallback.error.message);
  return ((fallback.data ?? []) as unknown as TicketRow[]).map(mapTicketRow);
}

export function useTickets(userId?: string, enabled = true) {
  const key = !enabled
    ? null
    : userId
      ? CACHE_KEYS.myTickets(userId)
      : CACHE_KEYS.tickets;

  return useSWR(
    isSupabaseConfigured() && key ? key : null,
    () => fetchTickets(userId),
    {
      keepPreviousData: true,
    }
  );
}

export function revalidateTickets(userId?: string) {
  void globalMutate(CACHE_KEYS.tickets);
  if (userId) {
    void globalMutate(CACHE_KEYS.myTickets(userId));
  }
}

export async function fetchSessionUserId() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useSessionUserId() {
  return useSWR(isSupabaseConfigured() ? CACHE_KEYS.session : null, fetchSessionUserId, {
    keepPreviousData: true,
  });
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient();
  const full = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (!full.error) return full.data;

  if (!isMissingDisplayName(full.error.message)) {
    throw new Error(full.error.message);
  }

  const fallback = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (fallback.error) throw new Error(fallback.error.message);
  if (!fallback.data) return null;
  return { ...fallback.data, display_name: null };
}

export function useProfile(userId: string | null) {
  return useSWR(
    userId ? CACHE_KEYS.profile(userId) : null,
    () => fetchProfile(userId as string),
    { keepPreviousData: true }
  );
}

function sanitizeWineQuery(query: string) {
  return query
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchWines(query: string): Promise<CanonicalWine[]> {
  const supabase = createClient();
  const trimmed = sanitizeWineQuery(query);
  let request = supabase
    .from("canonical_wines")
    .select("id, name, winery, region, grapes")
    .order("name")
    .limit(12);

  if (trimmed) {
    const pattern = `%${trimmed}%`;
    request = request.or(
      `name.ilike.${pattern},winery.ilike.${pattern},region.ilike.${pattern}`
    );
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useWineSearch(query: string) {
  return useSWR(
    isSupabaseConfigured() ? CACHE_KEYS.wines(query.trim()) : null,
    () => searchWines(query),
    {
      keepPreviousData: true,
      dedupingInterval: 8_000,
    }
  );
}

export function revalidateWines() {
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === "wines",
    undefined,
    { revalidate: true }
  );
}

export function revalidateProfile(userId: string) {
  void globalMutate(CACHE_KEYS.profile(userId));
  void globalMutate(CACHE_KEYS.tickets);
  void globalMutate(CACHE_KEYS.myTickets(userId));
}
