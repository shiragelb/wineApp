import type { Metadata } from "next";
import { ImagePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Upload",
};

export default function UploadPage() {
  return (
    <>
      <PageHeader
        eyebrow="New ticket"
        title="Hang a bottle"
        description="Photo, wine, rating, a few words. Image upload and sign-in come next."
      />
      <form className="space-y-5 px-4 py-5">
        <label className="flex aspect-[4/5] w-full cursor-not-allowed flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/50 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-medium">Add a photo</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Camera roll upload is not wired yet.
            </span>
          </span>
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Wine</legend>
          <input
            disabled
            placeholder="Search the canonical cellar…"
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-70"
          />
          <p className="text-xs text-muted-foreground">
            Later this will match or create a row in `canonical_wines`.
          </p>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Rating</legend>
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className="size-7 text-border"
              />
            ))}
          </div>
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Note</span>
          <textarea
            disabled
            rows={4}
            placeholder="What did it taste like, and who was at the table?"
            className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground disabled:opacity-70"
          />
        </label>

        <Button type="button" className="h-11 w-full" disabled>
          Post hang ticket
        </Button>
      </form>
    </>
  );
}
