import { createClient } from "@/lib/supabase/client";
import { revalidateTickets } from "@/lib/hooks";

export async function updateHangTicket(
  ticketId: string,
  patch: {
    wineId: string;
    rating: number;
    review: string;
    price?: number | null;
  }
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("Sign in to edit this ticket.");

  const payload: Record<string, unknown> = {
    wine_id: patch.wineId,
    rating: patch.rating,
    review_text: patch.review.trim() || null,
  };
  if (patch.price != null) payload.price = patch.price;

  let { error } = await supabase
    .from("hang_tickets")
    .update(payload)
    .eq("id", ticketId)
    .eq("user_id", user.id);

  if (error && /price|schema cache|does not exist/i.test(error.message)) {
    delete payload.price;
    const retry = await supabase
      .from("hang_tickets")
      .update(payload)
      .eq("id", ticketId)
      .eq("user_id", user.id);
    error = retry.error;
  }

  if (error) throw new Error(error.message);
  revalidateTickets(user.id);
}

function storagePathFromPublicUrl(imageUrl?: string) {
  if (!imageUrl) return null;
  const marker = "/object/public/hang_images/";
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(imageUrl.slice(index + marker.length).split("?")[0]);
}

export async function deleteHangTicket(ticketId: string, imageUrl?: string) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!user) throw new Error("Sign in to delete this ticket.");

  const { error } = await supabase
    .from("hang_tickets")
    .delete()
    .eq("id", ticketId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  const path = storagePathFromPublicUrl(imageUrl);
  if (path) {
    await supabase.storage.from("hang_images").remove([path]);
  }

  revalidateTickets(user.id);
}
