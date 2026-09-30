"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthDivider, GoogleButton } from "@/components/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withNextPath } from "@/lib/auth-path";
import { createClient } from "@/lib/supabase/client";

export function SignupForm({
  nextPath = "/",
  initialError = null,
}: {
  nextPath?: string;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSignUp() {
    setError(null);
    setNotice(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (nickname.trim().length > 48) {
      setError("Keep the nickname under 48 characters.");
      return;
    }

    setPending(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: nickname.trim() || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setNotice(
          "Account created. Confirm the email if your project requires it, then sign in."
        );
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create an account.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <GoogleButton
        nextPath={nextPath}
        label="Sign up with Google"
        onError={(message) => setError(message || null)}
      />
      <AuthDivider label="or sign up with email" />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSignUp();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input
            className="h-11 bg-card px-3"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@cellar.local"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Nickname</span>
          <Input
            className="h-11 bg-card px-3"
            type="text"
            autoComplete="nickname"
            maxLength={48}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="What friends should call you"
          />
          <span className="block text-xs text-muted-foreground">
            Optional. You can pick a unique @username later in settings.
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <Input
            className="h-11 bg-card px-3"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Confirm password</span>
          <Input
            className="h-11 bg-card px-3"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Type it again"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            {notice}
          </p>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have a cellar?{" "}
        <Link
          href={withNextPath("/login", nextPath)}
          prefetch={true}
          className="font-medium text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
