import PanelCard from "@/components/panels/PanelCard";
import PanelShell from "@/components/panels/PanelShell";
import {
  ActiveOrdersIcon,
  OrdersIcon,
  ProductsIcon,
  RestaurantIcon,
} from "@/components/panels/icons";
import { serverApiFetch } from "@/lib/session";

type DashboardRestaurant = {
  name: string;
  _count: { products: number; orders: number };
};

export default async function RestaurantDashboardPage() {
  let restaurant: DashboardRestaurant | null = null;
  let activeOrders = 0;

  try {
    const data = await serverApiFetch<{
      restaurant: DashboardRestaurant;
      activeOrdersCount: number;
    }>("/restaurant/dashboard");
    restaurant = data.restaurant;
    activeOrders = data.activeOrdersCount;
  } catch {
    restaurant = null;
    activeOrders = 0;
  }

  return (
    <PanelShell
      title="რესტორნის პანელი"
      subtitle={restaurant?.name ?? "რესტორანი ჯერ არ არის მიბმული"}
      backHref="/"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PanelCard
          href="/restaurant/orders"
          title="შეკვეთები"
          count={restaurant?._count.orders ?? 0}
          iconBg="bg-[#E5E7EB] text-neutral-700"
          icon={<OrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/restaurant/products"
          title="პროდუქტები"
          count={restaurant?._count.products ?? 0}
          iconBg="bg-[#DBEAFE] text-[#1D4ED8]"
          icon={<ProductsIcon className="size-7" />}
        />
        <PanelCard
          href="/restaurant/active-orders"
          title="აქტიური შეკვეთები"
          count={activeOrders}
          iconBg="bg-[#FFEDD5] text-[#C2410C]"
          icon={<ActiveOrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/restaurant/profile"
          title={"\u10e0\u10d4\u10e1\u10e2\u10dd\u10e0\u10dc\u10d8\u10e1 \u10de\u10e0\u10dd\u10e4\u10d8\u10da\u10d8"}
          description={"\u10d8\u10dc\u10e4\u10dd, \u10e1\u10d0\u10d0\u10d7\u10d4\u10d1\u10d8 \u10d3\u10d0 \u10db\u10d8\u10ec\u10dd\u10d3\u10d4\u10d1\u10d0"}
          iconBg="bg-[#DCFCE7] text-[#15803D]"
          icon={<RestaurantIcon className="size-7" />}
        />
      </div>
    </PanelShell>
  );
}
