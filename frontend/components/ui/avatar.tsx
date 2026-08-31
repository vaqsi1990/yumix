import { cn } from "@/lib/utils";
import Image from "next/image";

type AvatarProps = {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
};

export function Avatar({
  src,
  alt,
  fallback,
  className,
  size = "md",
}: AvatarProps) {
  const initials = fallback
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-muted",
          sizes[size],
          className,
        )}
      >
        <Image src={src} alt={alt} fill sizes="56px" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-600",
        sizes[size],
        className,
      )}
      title={alt}
    >
      {initials}
    </div>
  );
}
