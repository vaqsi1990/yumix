"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Package,
  PlusCircle,
  Settings,
  ShoppingBag,
  Star,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KA, NAV_ITEMS } from "@/lib/restaurant/labels";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const ICON_MAP = {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  PlusCircle,
  Package,
  Layers,
  Star,
  BarChart3,
  Settings,
  User,
} as const;

type RestaurantSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  restaurantName: string;
  restaurantLogo: string;
};

export default function RestaurantSidebar({
  collapsed,
  onToggle,
  restaurantName,
  restaurantLogo,
}: RestaurantSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "gap-3",
        )}
      >
        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={restaurantLogo}
            alt={restaurantName}
            className="size-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {restaurantName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {KA.ownerPanel}
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active =
              pathname === item.href ||
              (item.href !== "/restaurant/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[16px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-2",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onToggle}
          className={cn("w-full", !collapsed && "justify-start gap-2")}
          aria-label={collapsed ? "გაშლა" : "ჩაკეცვა"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span>{KA.collapse}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
