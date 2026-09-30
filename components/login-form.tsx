"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthDivider, GoogleButton } from "@/components/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withNextPath } from "@/lib/auth-path";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  nextPath = "/",
  initialError = null,
}: {
  nextPath?: string;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    setError(null);
    setPending(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <GoogleButton
        nextPath={nextPath}
        label="Sign in with Google"
        onError={(message) => setError(message || null)}
      />
      <AuthDivider />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSignIn();
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
          <span className="text-sm font-medium">Password</span>
          <Input
            className="h-11 bg-card px-3"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={withNextPath("/signup", nextPath)}
          prefetch={true}
          className="font-medium text-primary"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
