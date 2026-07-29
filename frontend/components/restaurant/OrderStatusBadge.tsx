import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/restaurant/labels";
import type { OrderStatus } from "@/lib/restaurant/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PREPARING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  READY: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  PICKED_UP: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  ON_THE_WAY: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", STATUS_STYLES[status] ?? "")}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
