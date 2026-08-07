"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import OrdersFilters, { OrdersFilterState } from "@/components/restaurant/orders/OrdersFilters";
import OrdersTable from "@/components/restaurant/orders/OrdersTable";
import OrderDetailsDialog from "@/components/restaurant/orders/OrderDetailsDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import TableSkeleton from "@/components/restaurant/skeletons/TableSkeleton";
import { Pagination } from "@/components/ui/pagination";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import type { OrderStatus, RestaurantOrder } from "@/lib/restaurant/types";

const PAGE_SIZE = 10;

export default function OrdersManager() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrdersFilterState>({
    search: "",
    status: "ALL",
    payment: "ALL",
    date: "",
  });
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await restaurantApi.orders();
      setOrders(res.orders);
    } catch (e) {
      if (!silent) {
        setError(
          translateApiError(e instanceof Error ? e.message : KA.failedLoad),
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadOrders(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q);
      const matchesStatus =
        filters.status === "ALL" || order.status === filters.status;
      const matchesPayment =
        filters.payment === "ALL" || order.paymentStatus === filters.payment;
      const matchesDate =
        !filters.date || order.createdAt.startsWith(filters.date);
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      const res = await restaurantApi.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? res.order : o)),
      );
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  function handleView(order: RestaurantOrder) {
    setSelectedOrder(order);
    setDetailsOpen(true);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.orders.title} description={KA.loading} />
        <TableSkeleton rows={8} cols={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.orders.title} description="" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.orders.title}
        description={KA.orders.subtitle}
      />

      <OrdersFilters filters={filters} onChange={setFilters} />

      {paginated.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={KA.orders.empty}
          description={KA.orders.emptyDesc}
        />
      ) : (
        <>
          <OrdersTable
            orders={paginated}
            onView={handleView}
            onStatusChange={handleStatusChange}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <OrderDetailsDialog
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
