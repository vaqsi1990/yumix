import { Suspense } from "react";
import OrdersManager from "@/components/restaurant/orders/OrdersManager";
import TableSkeleton from "@/components/restaurant/skeletons/TableSkeleton";

export default function OrdersPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={8} />}>
      <OrdersManager />
    </Suspense>
  );
}
