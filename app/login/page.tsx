import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { PageHeader } from "@/components/page-header";
import { SetupNeeded } from "@/components/setup-needed";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          eyebrow="Account"
          title="Sign in"
          description="Email and password against your Supabase project."
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
        title="Sign in"
        description="Use email and password. Create an account if you do not have one yet."
      />
      <div className="px-4 py-5">
        <LoginForm nextPath={nextPath} />
      </div>
    </>
  );
}
