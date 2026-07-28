import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
  /** Use on dark/pink backgrounds */
  onDark?: boolean;
  priority?: boolean;
  onClick?: () => void;
};

export default function Logo({
  href = "/",
  className,
  onDark = false,
  priority = false,
  onClick,
}: LogoProps) {
  const image = (
    <Image
      src="/yumix-logo.png"
      alt="Yumix"
      width={140}
      height={36}
      priority={priority}
      className={cn(
        "h-8 w-auto object-contain sm:h-9",
        onDark && "brightness-0 invert",
        className,
      )}
    />
  );

  if (!href) return image;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center"
      onClick={onClick}
      aria-label="Yumix — მთავარი"
    >
      {image}
    </Link>
  );
}
