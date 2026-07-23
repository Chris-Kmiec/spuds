import { createClient } from "@/lib/supabase/client";

export type UploadBucket = "event-images" | "avatars" | "community-images";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads an image to a public Storage bucket under the user's own folder
 * ("<uid>/<random>.<ext>") and returns its public URL.
 */
export async function uploadImage(
  file: File,
  bucket: UploadBucket
): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED.includes(file.type)) {
    return { error: "Please choose a JP, PNG, or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 5 MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in to upload." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: publicUrl };
}
