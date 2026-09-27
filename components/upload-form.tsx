"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { PlaceholderWine } from "@/lib/tickets";

const MAX_BYTES = 5 * 1024 * 1024;

export function UploadForm({ wine }: { wine: PlaceholderWine }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Add a photo of the bottle first.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Keep the photo under 5 MB.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }

    setPending(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Sign in before hanging a ticket.");
        router.push("/login?next=/upload");
        return;
      }

      const extension = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("hang_images")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("hang_images").getPublicUrl(path);

      const { error: insertError } = await supabase.from("hang_tickets").insert({
        user_id: user.id,
        wine_id: wine.id,
        image_url: publicUrl,
        rating,
        review_text: review.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not post ticket.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5 px-4 py-5" onSubmit={onSubmit}>
      <label className="relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/50 text-center">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected bottle"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
              <ImagePlus className="size-5" aria-hidden />
            </span>
            <span className="mt-3">
              <span className="block text-sm font-medium">Add a photo</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                JPG, PNG, or WebP · under 5 MB
              </span>
            </span>
          </>
        )}
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Wine</legend>
        <div className="rounded-xl border border-input bg-card px-3 py-3">
          <p className="text-sm font-medium">{wine.name}</p>
          <p className="text-xs text-muted-foreground">
            {wine.winery}
            {wine.region ? ` · ${wine.region}` : ""}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Temporary shortcut: this is the first row in `canonical_wines`. Wine
          search comes next.
        </p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Rating</legend>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const selected = value <= rating;

            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={rating === value}
                className="rounded-md p-0.5 text-primary transition-transform hover:scale-105"
                onClick={() => setRating(value)}
              >
                <Star
                  className={
                    selected
                      ? "size-7 fill-primary text-primary"
                      : "size-7 text-border"
                  }
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Note</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="What did it taste like, and who was at the table?"
          className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Hanging ticket…" : "Post hang ticket"}
      </Button>
    </form>
  );
}
