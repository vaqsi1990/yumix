"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import PendingApprovalBanner from "@/components/restaurant/PendingApprovalBanner";
import PageHeader from "@/components/restaurant/PageHeader";
import DashboardStatsGrid from "@/components/restaurant/dashboard/DashboardStatsGrid";
import RecentOrdersTable from "@/components/restaurant/dashboard/RecentOrdersTable";
import LatestReviews from "@/components/restaurant/dashboard/LatestReviews";
import PopularProducts from "@/components/restaurant/dashboard/PopularProducts";
import ChartPlaceholder from "@/components/restaurant/ChartPlaceholder";
import DashboardSkeleton from "@/components/restaurant/skeletons/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import { restaurantApi } from "@/lib/restaurant/api";
import type {
  DashboardStats,
  PopularProduct,
  RestaurantOrder,
  RestaurantReview,
  RestaurantSummary,
} from "@/lib/restaurant/types";
import { useEffect, useState } from "react";

type DashboardData = {
  restaurant: RestaurantSummary;
  stats: DashboardStats;
  recentOrders: RestaurantOrder[];
  latestReviews: RestaurantReview[];
  popularProducts: PopularProduct[];
};

type RestaurantDashboardProps = {
  initialData: DashboardData | null;
};

export default function RestaurantDashboard({
  initialData,
}: RestaurantDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    restaurantApi
      .dashboard()
      .then((res) =>
        setData({
          restaurant: res.restaurant,
          stats: res.stats,
          recentOrders: res.recentOrders,
          latestReviews: res.latestReviews,
          popularProducts: res.popularProducts,
        }),
      )
      .catch((e: Error) => setError(translateApiError(e.message)))
      .finally(() => setLoading(false));
  }, [initialData]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? KA.failedLoad}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.dashboard.title}
        description={`${KA.dashboard.welcome} ${data.restaurant.name} — ${KA.dashboard.subtitle}`}
        actions={
          data.restaurant.isApproved !== false ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/restaurants/${data.restaurant.slug}`} target="_blank">
                <ExternalLink className="size-4" />
                საიტზე ნახვა
              </Link>
            </Button>
          ) : undefined
        }
      />

      {data.restaurant.isApproved === false && <PendingApprovalBanner />}

      <DashboardStatsGrid stats={data.stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartPlaceholder
            title={KA.dashboard.revenueOverview}
            description={KA.dashboard.revenueOverviewDesc}
            height="h-72"
          />
        </div>
        <PopularProducts products={data.popularProducts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrdersTable orders={data.recentOrders} />
        <LatestReviews reviews={data.latestReviews} />
      </div>
    </div>
  );
}
