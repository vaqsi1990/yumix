import {
  Bike,
  Clock,
  Home,
  Package,
  type LucideIcon,
} from "lucide-react";

export type CourierNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export const COURIER_NAV: CourierNavItem[] = [
  {
    href: "/courier",
    label: "მთავარი",
    icon: Home,
    match: (pathname) => pathname === "/courier",
  },
  {
    href: "/courier/available",
    label: "ხელმისაწვდომი",
    icon: Package,
    match: (pathname) => pathname.startsWith("/courier/available"),
  },
  {
    href: "/courier/active",
    label: "აქტიური",
    icon: Bike,
    match: (pathname) => pathname.startsWith("/courier/active"),
  },
  {
    href: "/courier/history",
    label: "ისტორია",
    icon: Clock,
    match: (pathname) => pathname.startsWith("/courier/history"),
  },
];
