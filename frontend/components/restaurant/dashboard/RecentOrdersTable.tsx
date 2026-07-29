"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "@/components/restaurant/OrderStatusBadge";
import { formatCurrency, formatRelativeTime } from "@/lib/restaurant/format";
import { KA } from "@/lib/restaurant/labels";
import type { RestaurantOrder } from "@/lib/restaurant/types";
import { ArrowRight } from "lucide-react";

type RecentOrdersTableProps = {
  orders: RestaurantOrder[];
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {KA.dashboard.recentOrders}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/restaurant/orders">
            {KA.viewAll}
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{KA.order}</TableHead>
              <TableHead>{KA.customer}</TableHead>
              <TableHead>{KA.total}</TableHead>
              <TableHead>{KA.status}</TableHead>
              <TableHead className="text-right">{KA.date}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 5).map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatRelativeTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
