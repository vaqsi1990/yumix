"use client";

import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfileHref } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

type AuthNavProps = {
  onNavigate?: () => void;
};

export default function AuthNav({ onNavigate }: AuthNavProps) {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return (
      <div
        className="size-9 shrink-0 rounded-md border border-white/20 sm:size-10"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="inline-flex shrink-0 items-center rounded-md border border-white px-3 py-1.5 text-sm transition hover:bg-white/10 sm:px-4 sm:text-[16px]"
      >
        შესვლა
      </Link>
    );
  }

  const profileHref = getProfileHref(user);
  const displayName = user.name?.trim() || user.firstName?.trim() || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex max-w-[42vw] min-w-0 shrink-0 items-center gap-1 rounded-md border border-white/90 px-2 py-1.5 text-sm transition hover:bg-white/10 sm:max-w-[12rem] sm:gap-1.5 sm:px-2.5 sm:text-[16px]",
          )}
        >
          <span className="truncate font-medium">{displayName}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-90 sm:size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            href={profileHref}
            onClick={onNavigate}
            className="cursor-pointer"
          >
            <User className="size-4" />
            პროფილი
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => {
            onNavigate?.();
            void logout();
          }}
        >
          <LogOut className="size-4" />
          გამოსვლა
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
