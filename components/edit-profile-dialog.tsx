"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { CACHE_KEYS } from "@/lib/tickets";
import {
  USERNAME_PATTERN,
  embedNicknameInAvatarUrl,
  profileInitials,
  publicAvatarUrl,
  type ProfileRow,
} from "@/lib/profile";

const MAX_BYTES = 3 * 1024 * 1024;

export function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profile: ProfileRow | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EditProfileForm
          userId={userId}
          profile={profile}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function EditProfileForm({
  userId,
  profile,
  onOpenChange,
}: {
  userId: string;
  profile: ProfileRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate } = useSWRConfig();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return publicAvatarUrl(profile?.avatar_url) ?? null;
  }, [file, profile?.avatar_url]);

  useEffect(() => {
    if (!file || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [file, previewUrl]);

  async function onSave() {
    setError(null);
    const nextUsername = username.trim().toLowerCase();
    const nextDisplay = displayName.trim();

    if (!USERNAME_PATTERN.test(nextUsername)) {
      setError("Username must be 2–32 letters, numbers, dots, or underscores.");
      return;
    }

    if (nextDisplay.length > 48) {
      setError("Keep the nickname under 48 characters.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      let avatarUrl = publicAvatarUrl(profile?.avatar_url) ?? null;

      if (file) {
        if (!file.type.startsWith("image/")) {
          setError("Choose an image for your avatar.");
          return;
        }
        if (file.size > MAX_BYTES) {
          setError("Keep the avatar under 3 MB.");
          return;
        }
        const extension = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const path = `${userId}/avatar-${crypto.randomUUID()}.${extension}`;
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
        avatarUrl = supabase.storage.from("hang_images").getPublicUrl(path).data.publicUrl;
      }

      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", nextUsername)
        .neq("id", userId)
        .maybeSingle();

      if (taken) {
        setError("That username is already taken. Nicknames can be shared; usernames cannot.");
        return;
      }

      await supabase.auth.updateUser({
        data: {
          display_name: nextDisplay || null,
          username: nextUsername,
        },
      });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: nextUsername,
          display_name: nextDisplay || null,
          avatar_url: avatarUrl,
        })
        .eq("id", userId);

      if (updateError && updateError.message.includes("display_name")) {
        const fallback = await supabase
          .from("profiles")
          .update({
            username: nextUsername,
            avatar_url: embedNicknameInAvatarUrl(avatarUrl, nextDisplay || null),
          })
          .eq("id", userId);

        if (fallback.error) {
          setError(
            fallback.error.message.includes("duplicate") || fallback.error.code === "23505"
              ? "That username is already taken. Nicknames can be shared; usernames cannot."
              : fallback.error.message
          );
          return;
        }
      } else if (updateError) {
        setError(
          updateError.message.includes("duplicate") || updateError.code === "23505"
            ? "That username is already taken. Nicknames can be shared; usernames cannot."
            : updateError.message
        );
        return;
      }

      await Promise.all([
        mutate(CACHE_KEYS.profile(userId)),
        mutate(CACHE_KEYS.tickets),
        mutate(CACHE_KEYS.myTickets(userId)),
        mutate(
          (key) => Array.isArray(key) && key[0] === "profile-username",
          undefined,
          { revalidate: true }
        ),
      ]);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile.");
    } finally {
      setPending(false);
    }
  }

  const initials = profileInitials({
    username: username || "guest",
    display_name: displayName || null,
  });

  return (
    <DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Nickname is what friends see. Username is your unique @handle.
        </DialogDescription>
      </DialogHeader>

      <label className="flex cursor-pointer flex-col items-center gap-2">
        <span className="relative size-20 overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {previewUrl ? (
            file ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : (
              <Image
                src={previewUrl}
                alt=""
                width={80}
                height={80}
                className="size-full object-cover"
              />
            )
          ) : (
            <span className="flex size-full items-center justify-center">{initials}</span>
          )}
        </span>
        <span className="text-xs font-medium text-primary">Change photo</span>
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Nickname</span>
        <Input
          className="h-11 bg-card px-3"
          value={displayName}
          maxLength={48}
          placeholder="Shira"
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <span className="block text-xs text-muted-foreground">
          Shown on tickets. Two people can share the same nickname.
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Username</span>
        <Input
          className="h-11 bg-card px-3"
          value={username}
          maxLength={32}
          placeholder="shira.pours"
          onChange={(event) => setUsername(event.target.value)}
        />
        <span className="block text-xs text-muted-foreground">
          Unique @handle. Nobody else can take this one.
        </span>
      </label>

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={pending} onClick={() => void onSave()}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
