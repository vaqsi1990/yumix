"use client";

import {
  CheckCircle2,
  ChefHat,
  Eye,
  MoreHorizontal,
  PackageCheck,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderStatusBadge from "@/components/restaurant/OrderStatusBadge";
import PaymentStatusBadge from "@/components/restaurant/PaymentStatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/restaurant/format";
import { KA, PAYMENT_METHOD_LABELS } from "@/lib/restaurant/labels";
import type { OrderStatus, RestaurantOrder } from "@/lib/restaurant/types";

type OrdersTableProps = {
  orders: RestaurantOrder[];
  onView: (order: RestaurantOrder) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
};

export default function OrdersTable({
  orders,
  onView,
  onStatusChange,
}: OrdersTableProps) {
  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{KA.order}</TableHead>
            <TableHead>{KA.customer}</TableHead>
            <TableHead>{KA.items}</TableHead>
            <TableHead>{KA.total}</TableHead>
            <TableHead>{KA.status}</TableHead>
            <TableHead>{KA.payment}</TableHead>
            <TableHead>{KA.method}</TableHead>
            <TableHead>{KA.date}</TableHead>
            <TableHead className="text-right">{KA.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customerPhone}
                  </p>
                </div>
              </TableCell>
              <TableCell>{order.itemsCount}</TableCell>
              <TableCell>{formatCurrency(order.total)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={order.paymentStatus} />
              </TableCell>
              <TableCell className="text-sm">
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                  order.paymentMethod}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(order)}>
                      <Eye className="size-4" />
                      {KA.viewDetails}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {order.status === "PENDING" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            onStatusChange(order.id, "ACCEPTED")
                          }
                        >
                          <CheckCircle2 className="size-4" />
                          {KA.accept}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            onStatusChange(order.id, "CANCELLED")
                          }
                        >
                          <XCircle className="size-4" />
                          {KA.reject}
                        </DropdownMenuItem>
                      </>
                    )}
                    {(order.status === "ACCEPTED" ||
                      order.status === "PENDING") && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusChange(order.id, "PREPARING")
                        }
                      >
                        <ChefHat className="size-4" />
                        {KA.markPreparing}
                      </DropdownMenuItem>
                    )}
                    {order.status === "PREPARING" && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order.id, "READY")}
                      >
                        <PackageCheck className="size-4" />
                        {KA.markReady}
                      </DropdownMenuItem>
                    )}
                    {order.status === "READY" && (
                      <DropdownMenuItem disabled className="text-neutral-400">
                        კურიერის მოლოდინში
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
