"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/restaurant/PageHeader";
import ChartPlaceholder from "@/components/restaurant/ChartPlaceholder";
import StatCard from "@/components/restaurant/StatCard";
import DashboardSkeleton from "@/components/restaurant/skeletons/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/restaurant/format";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import type { AnalyticsData } from "@/lib/restaurant/types";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.analytics();
      setData(res);
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        title={KA.analytics.title}
        description={KA.analytics.subtitle}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={KA.analytics.monthlyRevenue}
          value={formatCurrency(data.monthlyRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title={KA.analytics.weekOrders}
          value={data.weekOrders}
          icon={ShoppingBag}
        />
        <StatCard
          title={KA.analytics.avgOrderValue}
          value={formatCurrency(data.avgOrderValue)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPlaceholder
          title={KA.analytics.revenue}
          description={KA.analytics.revenueDesc}
          height="h-72"
        />
        <ChartPlaceholder
          title={KA.analytics.orders}
          description={KA.analytics.ordersDesc}
          height="h-72"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {KA.analytics.bestSellers}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bestSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{KA.noDataYet}</p>
            ) : (
              data.bestSellers.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.orders} {KA.analytics.orders}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {KA.analytics.popularCategories}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.popularCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{KA.noDataYet}</p>
            ) : (
              data.popularCategories.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
