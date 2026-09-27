"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"signin" | "signup" | null>(null);

  async function handleAuth(mode: "signin" | "signup") {
    setError(null);
    setNotice(null);
    setPending(mode);

    try {
      const supabase = createClient();

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
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
      }

      router.push(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setPending(null);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleAuth("signin");
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
          placeholder="At least 6 characters"
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

      <div className="grid gap-2">
        <Button type="submit" className="h-11 w-full" disabled={pending !== null}>
          {pending === "signin" ? "Signing in…" : "Sign in"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          disabled={pending !== null}
          onClick={() => void handleAuth("signup")}
        >
          {pending === "signup" ? "Creating account…" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
