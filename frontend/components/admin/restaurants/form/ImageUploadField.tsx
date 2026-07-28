"use client";

import Image from "next/image";
import { ImageIcon, Trash2 } from "lucide-react";
import "@uploadthing/react/styles.css";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  endpoint: "restaurantLogo" | "restaurantCover";
  aspect?: "square" | "wide";
  onError?: (message: string) => void;
};

export default function ImageUploadField({
  label,
  value,
  onChange,
  endpoint,
  aspect = "square",
  onError,
}: ImageUploadFieldProps) {
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
            "flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 p-4",
            aspect === "square" ? "aspect-square max-w-[200px]" : "min-h-[120px]",
          )}
        >
          <ImageIcon className="mb-2 size-8 text-neutral-400" />
          <p className="text-center text-xs text-muted-foreground">
            UploadThing · JPG, PNG · max 4MB
          </p>
        </div>
      )}
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          const url = res[0]?.ufsUrl ?? res[0]?.url;
          if (url) onChange(url);
        }}
        onUploadError={(err) => onError?.(err.message)}
      />
    </div>
  );
}
