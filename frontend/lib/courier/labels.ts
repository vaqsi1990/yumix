import { ORDER_STATUS_LABELS } from "@/lib/account/constants";
import type { OrderStatus } from "@/lib/types";

export function courierOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}
