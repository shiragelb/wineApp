import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { SignupForm } from "@/components/signup-form";
import { oauthErrorMessage, safeNextPath } from "@/lib/auth-path";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Create account",
};

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    error?: string;
    error_description?: string;
  }>;
}) {
  const { next, error, error_description } = await searchParams;
  const nextPath = safeNextPath(next);
  const initialError = oauthErrorMessage(error, error_description);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          eyebrow="Account"
          title="Create account"
          description="Start a cellar with Google or email."
        />
        <SetupNeeded />
      </>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect(nextPath);
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Create account"
        description="Google is fastest. Email works if you would rather keep it separate."
      />
      <div className="px-4 py-5">
        <SignupForm nextPath={nextPath} initialError={initialError} />
      </div>
    </>
  );
}
