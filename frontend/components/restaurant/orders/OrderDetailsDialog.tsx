"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import OrderStatusBadge from "@/components/restaurant/OrderStatusBadge";
import PaymentStatusBadge from "@/components/restaurant/PaymentStatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/restaurant/format";
import { KA, PAYMENT_METHOD_LABELS } from "@/lib/restaurant/labels";
import type { RestaurantOrder } from "@/lib/restaurant/types";

type OrderDetailsDialogProps = {
  order: RestaurantOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {KA.order} {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>

          <div className="grid gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{KA.customer}</p>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerPhone}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{KA.deliveryAddress}</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">{KA.payment}</p>
                <p className="font-medium">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{KA.date}</p>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
            {order.notes && (
              <div>
                <p className="text-muted-foreground">{KA.notes}</p>
                <p className="font-medium">{order.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-semibold">{KA.orderItems}</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {item.quantity}x {item.name}
                    </p>
                    {item.variantName ? (
                      <p className="text-xs text-muted-foreground">
                        {item.variantName}
                      </p>
                    ) : null}
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.customizations.join(" · ")}
                      </p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {item.addons.join(", ")}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <span className="font-semibold">{KA.total}</span>
            <span className="text-lg font-bold">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
