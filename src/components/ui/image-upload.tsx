"use client";

import { Button } from "@/components/ui/button";
import { uploadImage, type UploadBucket } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

/**
 * A drop/click image uploader with live preview. Calls onUploaded with the
 * public URL once the file is stored. Shape controls the preview aspect.
 */
export function ImageUpload({
  bucket,
  value,
  onUploaded,
  shape = "wide",
  label = "Upload a photo",
}: {
  bucket: UploadBucket;
  value?: string | null;
  onUploaded: (url: string) => void;
  shape?: "wide" | "square";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const result = await uploadImage(file, bucket);
    setUploading(false);
    if ("error" in result) setError(result.error);
    else onUploaded(result.url);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-soil-800/15 bg-cream-50 transition-colors hover:border-spud-300 disabled:opacity-60",
          shape === "wide" ? "aspect-[16/9]" : "aspect-square",
          shape === "square" && "mx-auto max-w-40"
        )}
      >
        {value && !uploading && (
          <Image
            src={value}
            alt="Uploaded preview"
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        )}
        <div
          className={cn(
            "z-10 flex flex-col items-center gap-1 text-sm font-semibold text-soil-800/60",
            value && !uploading && "rounded-lg bg-white/85 px-3 py-2 backdrop-blur"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="size-5" />
              {value ? "Replace photo" : label}
            </>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
