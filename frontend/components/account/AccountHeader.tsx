"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, LogOut, MapPin, Search, User } from "lucide-react";
import Logo from "@/components/Logo";
import CartBadge from "@/components/shop/CartBadge";
import { useAuth } from "@/components/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { formatAddressLine } from "@/lib/account/constants";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/account-api";
import type { Address } from "@/lib/shop-api";

type AccountHeaderProps = {
  defaultAddress?: Address | null;
};

export default function AccountHeader({ defaultAddress }: AccountHeaderProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    void fetchNotifications()
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]));
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;
  const displayName = user?.firstName?.trim() || user?.name?.trim() || "მომხმარებელი";

  async function handleRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  async function handleReadAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo className="shrink-0" />

        <Link
          href="/search"
          className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 transition hover:border-neutral-300 md:flex max-w-md"
        >
          <Search className="size-4 shrink-0" />
          <span>რესტორნის ან კერძის ძებნა...</span>
        </Link>

        {defaultAddress && (
          <div className="hidden min-w-0 items-center gap-1.5 text-sm text-neutral-600 lg:flex">
            <MapPin className="size-4 shrink-0 text-[#FF0050]" />
            <span className="truncate max-w-[180px]">
              {formatAddressLine(defaultAddress)}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
                aria-label="შეტყობინებები"
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#FF0050] text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-semibold">შეტყობინებები</span>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleReadAll()}
                    className="text-xs text-[#FF0050] hover:underline"
                  >
                    ყველას წაკითხვა
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-neutral-500">
                  შეტყობინებები არ არის
                </p>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="cursor-pointer flex-col items-start gap-0.5 py-2"
                    onClick={() => {
                      void handleRead(n.id);
                      if (n.orderId) {
                        window.location.href = `/account/orders/${n.orderId}`;
                      }
                    }}
                  >
                    <span className={n.isRead ? "text-neutral-500" : "font-medium"}>
                      {n.title}
                    </span>
                    <span className="text-xs text-neutral-400 line-clamp-2">
                      {n.message}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <CartBadge variant="light" />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm transition hover:bg-neutral-50"
                >
                  <Avatar
                    src={user.avatar ?? undefined}
                    alt={displayName}
                    fallback={displayName}
                    size="sm"
                  />
                  <span className="hidden max-w-24 truncate font-medium sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="size-4 text-neutral-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/account/profile" className="cursor-pointer">
                    <User className="size-4" />
                    პროფილი
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/settings" className="cursor-pointer">
                    პარამეტრები
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
          )}
        </div>
      </div>
    </header>
  );
}
