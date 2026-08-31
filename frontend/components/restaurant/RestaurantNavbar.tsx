"use client";

import Link from "next/link";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { KA } from "@/lib/restaurant/labels";

type RestaurantNavbarProps = {
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  ownerName: string;
  ownerAvatar: string;
  pendingOrders: number;
};

export default function RestaurantNavbar({
  onMenuClick,
  darkMode,
  onToggleDarkMode,
  ownerName,
  ownerAvatar,
  pendingOrders,
}: RestaurantNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="მენიუ"
      >
        <Menu className="size-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={KA.searchPlaceholder} className="h-9 pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          aria-label="მუქი რეჟიმი"
        >
          {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link
            href="/restaurant/orders?status=PENDING"
            aria-label="შეტყობინებები"
          >
            <Bell className="size-5" />
            {pendingOrders > 0 && (
              <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">
                {pendingOrders > 9 ? "9+" : pendingOrders}
              </Badge>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar
                src={ownerAvatar}
                alt={ownerName}
                fallback={ownerName}
                size="sm"
              />
              <span className="hidden text-sm font-medium md:inline">
                {ownerName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{KA.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/restaurant/profile">{KA.profileNav}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/restaurant/settings">{KA.restaurantSettings}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">{KA.backToStore}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
