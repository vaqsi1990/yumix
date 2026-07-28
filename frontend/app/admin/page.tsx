import PanelCard from "@/components/panels/PanelCard";
import PanelShell from "@/components/panels/PanelShell";
import {
  ActiveOrdersIcon,
  CourierIcon,
  OrdersIcon,
  ProductsIcon,
  RestaurantIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/panels/icons";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminStats = {
  ordersCount: number;
  usersCount: number;
  restaurantsCount: number;
  couriersCount: number;
  activeOrdersCount: number;
};

export default async function AdminDashboardPage() {
  let stats: AdminStats = {
    ordersCount: 0,
    usersCount: 0,
    restaurantsCount: 0,
    couriersCount: 0,
    activeOrdersCount: 0,
  };
  let couponsCount = 0;
  let productsCount = 0;

  try {
    const [statsData, couponsData, productsData] = await Promise.all([
      serverApiFetch<AdminStats>("/admin/stats"),
      serverApiFetch<{ coupons: { isActive: boolean }[] }>("/admin/coupons"),
      serverApiFetch<{ products: unknown[] }>("/admin/products"),
    ]);
    stats = statsData;
    couponsCount = couponsData.coupons.filter((c) => c.isActive).length;
    productsCount = productsData.products.length;
  } catch {
    // empty dashboard counts on failure
  }

  return (
    <PanelShell
      title={"\u10d0\u10d3\u10db\u10d8\u10dc\u10d8\u10e1\u10e2\u10e0\u10d0\u10e2\u10dd\u10e0\u10d8\u10e1 \u10de\u10d0\u10dc\u10d4\u10da\u10d8"}
      subtitle={"\u10db\u10dd\u10dc\u10d0\u10ea\u10d4\u10db\u10d4\u10d1\u10d8 Render \u10d1\u10d0\u10d6\u10d8\u10d3\u10d0\u10dc"}
      backHref="/"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PanelCard
          href="/admin/orders"
          title={"\u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d4\u10d1\u10d8"}
          count={stats.ordersCount}
          iconBg="bg-[#E5E7EB] text-neutral-700"
          icon={<OrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/users"
          title={"\u10db\u10dd\u10db\u10ee\u10db\u10d0\u10e0\u10d4\u10d1\u10da\u10d4\u10d1\u10d8"}
          count={stats.usersCount}
          iconBg="bg-[#DCFCE7] text-[#15803D]"
          icon={<UsersIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/restaurants"
          title={"\u10e0\u10d4\u10e1\u10e2\u10dd\u10e0\u10dc\u10d4\u10d1\u10d8"}
          count={stats.restaurantsCount}
          iconBg="bg-[#DBEAFE] text-[#1D4ED8]"
          icon={<RestaurantIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/couriers"
          title={"\u10d9\u10e3\u10e0\u10d8\u10d4\u10e0\u10d4\u10d1\u10d8"}
          count={stats.couriersCount}
          iconBg="bg-[#EDE9FE] text-[#6D28D9]"
          icon={<CourierIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/active-orders"
          title={"\u10d0\u10e5\u10e2\u10d8\u10e3\u10e0\u10d8 \u10e8\u10d4\u10d9\u10d5\u10d4\u10d7\u10d4\u10d1\u10d8"}
          count={stats.activeOrdersCount}
          iconBg="bg-[#FFEDD5] text-[#C2410C]"
          icon={<ActiveOrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/coupons"
          title="კუპონები"
          count={couponsCount}
          iconBg="bg-[#FCE7F3] text-[#BE185D]"
          icon={<OrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/products"
          title="პროდუქტები"
          count={productsCount}
          iconBg="bg-[#E0E7FF] text-[#4338CA]"
          icon={<ProductsIcon className="size-7" />}
        />
        <PanelCard
          href="/admin/settings"
          title="პარამეტრები"
          description="პროფილი და პაროლი"
          iconBg="bg-[#F3F4F6] text-neutral-700"
          icon={<SettingsIcon className="size-7" />}
        />
      </div>
    </PanelShell>
  );
}
