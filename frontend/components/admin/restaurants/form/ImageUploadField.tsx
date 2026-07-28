"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAdminImage } from "@/lib/admin-upload";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: "square" | "wide";
  onError?: (message: string) => void;
};

export default function ImageUploadField({
  label,
  value,
  onChange,
  aspect = "square",
  onError,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || isUploading) return;

    setLocalError("");
    setIsUploading(true);
    try {
      const url = await uploadAdminImage(file);
      onChange(url);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "ატვირთვა ვერ მოხერხდა";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-800">{label}</p>

      {value ? (
        <div
          className={cn(
            "group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50",
            aspect === "square" ? "aspect-square max-w-[200px]" : "aspect-[3/1]",
          )}
        >
          <Image
            src={value}
            alt={label}
            fill
            sizes={aspect === "square" ? "200px" : "600px"}
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-4" />
              წაშლა
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 p-4 text-center",
            aspect === "square" ? "aspect-square max-w-[200px]" : "min-h-[120px]",
          )}
        >
          <ImageIcon className="mb-2 size-8 text-neutral-400" />
          <p className="text-xs text-muted-foreground">JPG, PNG · max 4MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={isUploading}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {isUploading ? "იტვირთება..." : value ? "შეცვლა" : "ფოტოს ატვირთვა"}
      </Button>

      {localError && (
        <p className="text-xs text-destructive">{localError}</p>
      )}
    </div>
  );
}
