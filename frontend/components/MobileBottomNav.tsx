"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  LogOut,
  Search,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfileHref, isProfileNavActive } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

const staticNavItems: NavItem[] = [
  {
    href: "/",
    label: "მთავარი",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/categories",
    label: "კატეგორიები",
    icon: LayoutGrid,
    isActive: (pathname) => pathname.startsWith("/categories"),
  },
  {
    href: "/search",
    label: "ძებნა",
    icon: Search,
    isActive: (pathname) => pathname === "/search",
  },
  
];

const navItemClassName = (active: boolean) =>
  cn(
    "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition active:opacity-70",
    active ? "text-[#FF0050]" : "text-neutral-500",
  );

function MobileProfileNavItem() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const active = isProfileNavActive(pathname, user);

  if (!user) {
    return (
      <Link href="/login" className={navItemClassName(active)}>
        <User
          className="size-5 shrink-0"
          strokeWidth={active ? 2.25 : 1.75}
          aria-hidden="true"
        />
        <span className="w-full truncate text-center text-[12px] font-medium leading-tight">
          პროფილი
        </span>
      </Link>
    );
  }

  const profileHref = getProfileHref(user);
  const displayName =
    user.firstName?.trim() ||
    user.name?.trim().split(/\s+/)[0] ||
    user.email.split("@")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={navItemClassName(active)}>
          <User
            className="size-5 shrink-0"
            strokeWidth={active ? 2.25 : 1.75}
            aria-hidden="true"
          />
          <span className="w-full truncate text-center text-[12px] font-medium leading-tight">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="mb-2 w-48">
        <DropdownMenuItem asChild>
          <Link href={profileHref} className="cursor-pointer">
            <User className="size-4" />
            პროფილი
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
          გამოსვლა
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav md:hidden" aria-label="მთავარი ნავიგაცია">
      <div className="mx-auto flex h-[var(--mobile-nav-height)] max-w-lg items-stretch justify-around px-1">
        {staticNavItems.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);

          return (
            <Link
              key={label}
              href={href}
              className={navItemClassName(active)}
            >
              <Icon
                className="size-5 shrink-0"
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden="true"
              />
              <span className="w-full truncate text-center text-[12px] font-medium leading-tight">
                {label}
              </span>
            </Link>
          );
        })}

        <MobileProfileNavItem />
      </div>
    </nav>
  );
}
