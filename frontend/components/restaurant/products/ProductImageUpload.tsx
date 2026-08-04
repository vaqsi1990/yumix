"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAdminImage } from "@/lib/admin-upload";
import { cn } from "@/lib/utils";

type ProductImageUploadProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onError?: (message: string) => void;
  className?: string;
};

export default function ProductImageUpload({
  label,
  value,
  onChange,
  onError,
  className,
}: ProductImageUploadProps) {
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
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-foreground">{label}</p>

      {value ? (
        <div className="group relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-xl border border-border bg-muted">
          <Image
            src={value}
            alt={label}
            fill
            sizes="200px"
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
        <div className="mx-auto flex aspect-square w-full max-w-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center">
          <ImageIcon className="mb-2 size-8 text-muted-foreground" />
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
        <p className="text-[16px] text-destructive md:text-[18px]">{localError}</p>
      )}
    </div>
  );
}
