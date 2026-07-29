"use client";

import {
  CheckCircle2,
  Clock,
  DollarSign,
  ShoppingBag,
  Star,
  Timer,
  Utensils,
} from "lucide-react";
import StatCard from "@/components/restaurant/StatCard";
import { formatCurrency } from "@/lib/restaurant/format";
import { KA } from "@/lib/restaurant/labels";
import type { DashboardStats } from "@/lib/restaurant/types";

type DashboardStatsGridProps = {
  stats: DashboardStats;
};

export default function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={KA.dashboard.todayOrders}
        value={stats.todayOrders}
        icon={ShoppingBag}
        trend={{ value: 12, label: KA.vsYesterday }}
        iconClassName="bg-blue-500/10 text-blue-600"
      />
      <StatCard
        title={KA.dashboard.pendingOrders}
        value={stats.pendingOrders}
        icon={Clock}
        iconClassName="bg-amber-500/10 text-amber-600"
      />
      <StatCard
        title={KA.dashboard.preparing}
        value={stats.preparingOrders}
        icon={Utensils}
        iconClassName="bg-purple-500/10 text-purple-600"
      />
      <StatCard
        title={KA.dashboard.ready}
        value={stats.readyOrders}
        icon={Timer}
        iconClassName="bg-cyan-500/10 text-cyan-600"
      />
      <StatCard
        title={KA.dashboard.completedToday}
        value={stats.completedOrders}
        icon={CheckCircle2}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />
      <StatCard
        title={KA.dashboard.todayRevenue}
        value={formatCurrency(stats.todayRevenue)}
        icon={DollarSign}
        trend={{ value: 8.4, label: KA.vsYesterday }}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatCard
        title={KA.dashboard.monthlyRevenue}
        value={formatCurrency(stats.monthlyRevenue)}
        icon={DollarSign}
        trend={{ value: 15.2, label: KA.vsLastMonth }}
        iconClassName="bg-indigo-500/10 text-indigo-600"
      />
      <StatCard
        title={KA.dashboard.averageRating}
        value={`${stats.averageRating.toFixed(1)} / 5`}
        icon={Star}
        iconClassName="bg-amber-500/10 text-amber-600"
      />
    </div>
  );
}
