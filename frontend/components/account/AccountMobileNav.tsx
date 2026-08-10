"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Heart, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/account", label: "მთავარი", icon: Home, match: (p: string) => p === "/account" },
  { href: "/account/orders", label: "შეკვეთები", icon: Package, match: (p: string) => p.startsWith("/account/orders") },
  { href: "/account/favorites", label: "რჩეულები", icon: Heart, match: (p: string) => p.startsWith("/account/favorites") },
  { href: "/cart", label: "კალათა", icon: ShoppingCart, match: (p: string) => p.startsWith("/cart") },
  { href: "/account/profile", label: "პროფილი", icon: User, match: (p: string) => p.startsWith("/account/profile") || p.startsWith("/account/settings") },
];

export default function AccountMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="ანგარიშის ნავიგაცია"
    >
      <div className="mx-auto flex h-[var(--mobile-nav-height)] max-w-lg items-stretch justify-around px-1">
        {MOBILE_NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                active ? "text-[#FF0050]" : "text-neutral-500",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
