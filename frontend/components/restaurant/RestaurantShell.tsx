"use client";

import { useEffect, useState, type ReactNode } from "react";
import RestaurantSidebar from "./RestaurantSidebar";
import RestaurantNavbar from "./RestaurantNavbar";
import RestaurantOnboardingForm from "./RestaurantOnboardingForm";
import PendingApprovalBanner from "./PendingApprovalBanner";
import {
  RestaurantShellProvider,
  RestaurantShellIbanBanner,
} from "./RestaurantShellContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ShellData } from "@/lib/restaurant/types";

type RestaurantShellProps = {
  children: ReactNode;
  shellData: ShellData;
};

export default function RestaurantShell({
  children,
  shellData,
}: RestaurantShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(shellData.pendingOrders);

  useEffect(() => {
    const stored = localStorage.getItem("restaurant-dark-mode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    setPendingOrders(shellData.pendingOrders);
  }, [shellData.pendingOrders]);

  useEffect(() => {
    if (!shellData.hasRestaurant) return;

    async function pollPendingOrders() {
      try {
        const res = await fetch("/api/backend/restaurant/dashboard");
        if (!res.ok) return;
        const data = (await res.json()) as {
          stats?: { pendingOrders?: number };
        };
        setPendingOrders(data.stats?.pendingOrders ?? 0);
      } catch {
        // ignore polling errors
      }
    }

    void pollPendingOrders();
    const timer = setInterval(pollPendingOrders, 15000);
    return () => clearInterval(timer);
  }, [shellData.hasRestaurant]);

  function toggleDarkMode() {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("restaurant-dark-mode", String(next));
      return next;
    });
  }

  if (!shellData.hasRestaurant) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <RestaurantOnboardingForm owner={shellData.owner} />
      </div>
    );
  }

  const restaurantName = shellData.restaurant.name;
  const restaurantLogo = shellData.restaurant.logo ?? "/yumix-logo.svg";
  const ownerName = `${shellData.owner.firstName} ${shellData.owner.lastName}`;
  const ownerAvatar = shellData.owner.avatar ?? "";

  return (
    <RestaurantShellProvider
      initialHasIban={shellData.restaurant.hasIban ?? false}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden bg-background">
      <div className="hidden lg:flex">
        <RestaurantSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          restaurantName={restaurantName}
          restaurantLogo={restaurantLogo}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <RestaurantSidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            restaurantName={restaurantName}
            restaurantLogo={restaurantLogo}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <RestaurantNavbar
          onMenuClick={() => setMobileOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          ownerName={ownerName}
          ownerAvatar={ownerAvatar}
          pendingOrders={pendingOrders}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            {shellData.restaurant.isApproved === false && (
              <PendingApprovalBanner />
            )}
            <RestaurantShellIbanBanner />
            {children}
          </div>
        </main>
      </div>
      </div>
    </RestaurantShellProvider>
  );
}
