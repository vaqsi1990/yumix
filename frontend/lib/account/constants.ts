import type { OrderStatus } from "@/lib/types";
import {
  HelpCircle,
  Heart,
  Home,
  MapPin,
  Package,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

export const ACCOUNT_NAV: {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
}[] = [
  { href: "/account", label: "მთავარი", icon: Home, mobile: true },
  { href: "/account/orders", label: "შეკვეთები", icon: Package, mobile: true },
  { href: "/account/favorites", label: "რჩეულები", icon: Heart, mobile: true },
  { href: "/account/addresses", label: "მისამართები", icon: MapPin },
  { href: "/account/profile", label: "პროფილი", icon: User, mobile: true },
  { href: "/account/settings", label: "პარამეტრები", icon: Settings },
  { href: "/account/help", label: "დახმარება", icon: HelpCircle },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "მოლოდინში",
  ACCEPTED: "მიღებული",
  PREPARING: "მზადდება",
  READY: "მზადაა",
  PICKED_UP: "აღებულია",
  ON_THE_WAY: "გზაშია",
  DELIVERED: "მიწოდებული",
  CANCELLED: "გაუქმებული",
};

export const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "ON_THE_WAY",
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "ბარათი",
  CASH: "ნაღდი",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
};

export function formatAddressLine(address: {
  city: string;
  street: string;
  building?: string | null;
  apartment?: string | null;
}) {
  const parts = [address.city, address.street];
  if (address.building) parts.push(address.building);
  if (address.apartment) parts.push(`ბ. ${address.apartment}`);
  return parts.join(", ");
}
