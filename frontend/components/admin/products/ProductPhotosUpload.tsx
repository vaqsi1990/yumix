"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAdminImage } from "@/lib/admin-upload";
import { cn } from "@/lib/utils";

type ProductPhotosUploadProps = {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onError?: (message: string) => void;
  maxPhotos?: number;
};

export default function ProductPhotosUpload({
  photos,
  onPhotosChange,
  onError,
  maxPhotos = 8,
}: ProductPhotosUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const remaining = maxPhotos - photos.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length || isUploading || remaining <= 0) return;

    setLocalError("");
    setIsUploading(true);

    const batch = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];

    try {
      for (const file of batch) {
        uploaded.push(await uploadAdminImage(file));
      }
      onPhotosChange([...photos, ...uploaded].slice(0, maxPhotos));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "ატვირთვა ვერ მოხერხდა";
      setLocalError(msg);
      onError?.(msg);
      if (uploaded.length) {
        onPhotosChange([...photos, ...uploaded].slice(0, maxPhotos));
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    onPhotosChange(photos.filter((p) => p !== url));
  }

  function setMainPhoto(url: string) {
    onPhotosChange([url, ...photos.filter((p) => p !== url)]);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={isUploading || remaining <= 0}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isUploading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isUploading
            ? "იტვირთება..."
            : remaining <= 0
              ? "ლიმიტი ამოწურულია"
              : "ფოტოს ატვირთვა"}
        </Button>
        <span className="text-[16px] md:text-[18px] text-muted-foreground">
          {photos.length}/{maxPhotos} · JPG, PNG · max 4MB
        </span>
      </div>

      {localError && <p className="text-[16px] md:text-[18px] text-destructive">{localError}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((url, index) => (
            <div
              key={url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border",
                index === 0 && "border-primary ring-1 ring-primary/30",
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                  მთავარი
                </span>
              )}
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                onClick={() => removePhoto(url)}
              >
                წაშლა
              </button>
              {index !== 0 && (
                <button
                  type="button"
                  className="absolute bottom-1 left-1 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => setMainPhoto(url)}
                >
                  მთავარი
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
