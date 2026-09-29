import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
          description="Photo, wine, rating, and a note."
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

  return (
    <>
      <PageHeader
        eyebrow="New ticket"
        title="Hang a bottle"
        description="Search the cellar or add a wine, then hang the bottle."
      />
      <UploadForm />
    </>
  );
}
