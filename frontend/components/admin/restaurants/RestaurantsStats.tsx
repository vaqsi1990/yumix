"use client";

import {
  CheckCircle2,
  Clock,
  Store,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RestaurantStats } from "./utils";

type RestaurantsStatsProps = {
  stats: RestaurantStats;
};

const items = [
  {
    key: "total" as const,
    label: "სულ რესტორნები",
    icon: Store,
    color: "text-neutral-900",
    bg: "bg-neutral-100",
  },
  {
    key: "approved" as const,
    label: "დამტკიცებული",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  {
    key: "pending" as const,
    label: "მოლოდინში",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  {
    key: "closed" as const,
    label: "დაკეტილი",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
  },
];

export default function RestaurantsStats({ stats }: RestaurantsStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="border-neutral-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={`flex size-11 items-center justify-center rounded-xl ${bg}`}
            >
              <Icon className={`size-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-neutral-900">
                {stats[key]}
              </p>
              <p className="text-[16px] md:text-[18px] text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
