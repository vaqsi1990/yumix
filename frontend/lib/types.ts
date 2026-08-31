export type Role = "USER" | "COURIER" | "RESTAURANT_OWNER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export type VehicleType = "BICYCLE" | "MOTORBIKE" | "CAR";
