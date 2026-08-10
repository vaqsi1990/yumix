"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { cn } from "@/lib/utils";

type CartBadgeProps = {
  onNavigate?: () => void;
  variant?: "onDark" | "light";
  className?: string;
};

export default function CartBadge({
  onNavigate,
  variant = "onDark",
  className,
}: CartBadgeProps) {
  const { user } = useAuth();
  const { itemCount, ready } = useCart();

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md p-2 transition hover:bg-white/10",
          variant === "onDark" ? "text-white" : "text-neutral-700 hover:bg-neutral-100",
          className,
        )}
        aria-label="კალათა — შესვლა"
      >
        <CartIcon />
      </Link>
    );
  }

  const count = ready ? itemCount : 0;

  return (
    <Link
      href="/cart"
      onClick={onNavigate}
      className={cn(
        "relative inline-flex items-center justify-center rounded-md p-2 transition",
        variant === "onDark"
          ? "text-white hover:bg-white/10"
          : "text-neutral-700 hover:bg-neutral-100",
        className,
      )}
      aria-label={count > 0 ? `კალათა, ${count} ნივთი` : "კალათა"}
    >
      <CartIcon />
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-5",
            variant === "onDark"
              ? "bg-white text-[#FF0050] ring-2 ring-[#FF0050]"
              : "bg-[#FF0050] text-white",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 6h15l-1.5 9h-12L5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}
