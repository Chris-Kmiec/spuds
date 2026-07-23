"use client";

import { updateProfile } from "./actions";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input, Textarea } from "@/components/ui/input";
import type { Profile } from "@/lib/types";
import { LogOut, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ProfileSettings({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="size-4" /> Edit profile
        </Button>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="size-4" /> Log out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card className="space-y-3 bg-cream-50 p-4 text-left">
      <div className="space-y-1">
        <span className="text-sm font-semibold">Profile photo</span>
        <ImageUpload
          bucket="avatars"
          value={avatarUrl}
          onUploaded={setAvatarUrl}
          shape="square"
          label="Upload a photo"
        />
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Display name</span>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Bio</span>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Location</span>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={80}
        />
      </label>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await updateProfile({
                display_name: displayName,
                bio,
                location,
                avatar_url: avatarUrl,
              });
              if (result.error) setError(result.error);
              else {
                setEditing(false);
                router.refresh();
              }
            });
          }}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
