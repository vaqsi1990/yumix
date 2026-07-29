"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatGel } from "@/lib/admin/format";

type OrderRow = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user?: { firstName: string; lastName: string; phone: string };
  restaurant?: { id: string; name: string };
};

type RestaurantOrdersPanelProps = {
  restaurantId: string;
};

export default function RestaurantOrdersPanel({
  restaurantId,
}: RestaurantOrdersPanelProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/backend/admin/orders");
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { orders: OrderRow[] };
        setOrders(
          data.orders.filter(
            (order) => order.restaurant?.id === restaurantId,
          ),
        );
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [restaurantId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          იტვირთება...
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">შეკვეთები ჯერ არ არის</p>
          <Link
            href="/admin/orders"
            className="text-[16px] md:text-[18px] font-medium text-primary hover:underline"
          >
            ყველა შეკვეთა →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>მომხმარებელი</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead>თანხა</TableHead>
              <TableHead>თარიღი</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-[16px] md:text-[18px]">
                  {order.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  {order.user
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : "—"}
                </TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{formatGel(order.total)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
