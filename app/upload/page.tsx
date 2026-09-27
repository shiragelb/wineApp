import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { UploadForm } from "@/components/upload-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Upload",
};

export default async function UploadPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          eyebrow="New ticket"
          title="Hang a bottle"
          description="Photo, rating, and a note — attached to a placeholder wine for now."
        />
        <SetupNeeded />
      </>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login?next=/upload");
  }

  const { data: wine } = await supabase
    .from("canonical_wines")
    .select("id, name, winery, region")
    .limit(1)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="New ticket"
        title="Hang a bottle"
        description="Photo, rating, and a few words. Wine search comes after this pipeline."
      />
      {wine ? (
        <UploadForm wine={wine} />
      ) : (
        <div className="px-4 py-5">
          <EmptyState
            title="No wines in the cellar yet"
            body="Run supabase/seed.sql in the SQL Editor so uploads have a wine_id to attach."
          />
        </div>
      )}
    </>
  );
}
