import type { OrderStatus, Role, VehicleType } from "@/lib/types";

export const ORDER_STATUS_KA: Record<OrderStatus, string> = {
  PENDING: "მოლოდინში",
  ACCEPTED: "მიღებული",
  PREPARING: "მზადდება",
  READY: "მზადაა",
  PICKED_UP: "აღებულია",
  ON_THE_WAY: "გზაშია",
  DELIVERED: "მიწოდებული",
  CANCELLED: "გაუქმებული",
};

export const VEHICLE_KA: Record<VehicleType, string> = {
  BICYCLE: "ველოსიპედი",
  MOTORBIKE: "მოტოციკლი",
  CAR: "მანქანა",
};

export const ROLE_KA: Record<Role, string> = {
  USER: "მომხმარებელი",
  COURIER: "კურიერი",
  RESTAURANT_OWNER: "რესტორნის მფლობელი",
  ADMIN: "ადმინი",
};
