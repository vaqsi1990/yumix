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

function YumixWordmark({
  className,
  onDark,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 32"
      fill="none"
      aria-hidden="true"
      className={cn(
        "h-8 w-[110px] shrink-0 sm:h-9 sm:w-[124px]",
        onDark ? "text-white" : "text-[#FF0050]",
        className,
      )}
    >
      <text
        x="0"
        y="25"
        fill="currentColor"
        fontFamily="var(--font-inter), Inter, Arial, sans-serif"
        fontSize="26"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        Yumix
      </text>
    </svg>
  );
}

export default function Logo({
  href = "/",
  className,
  onDark = false,
  onClick,
}: LogoProps) {
  const image = <YumixWordmark className={className} onDark={onDark} />;

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
