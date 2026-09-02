"use client";

import PanelCard from "@/components/panels/PanelCard";
import PanelShell from "@/components/panels/PanelShell";
import CourierOnlineToggle from "@/components/courier/CourierOnlineToggle";
import {
  ActiveOrdersIcon,
  CourierIcon,
  OrdersIcon,
} from "@/components/panels/icons";
import { useEffect, useState } from "react";
import { fetchCourierDashboard } from "@/lib/courier-api";

export default function CourierDashboardClient() {
  const [counts, setCounts] = useState({
    available: 0,
    myActive: 0,
    delivered: 0,
  });

  useEffect(() => {
    void fetchCourierDashboard()
      .then((data) =>
        setCounts({
          available: data.availableCount,
          myActive: data.myActiveCount,
          delivered: data.deliveredCount,
        }),
      )
      .catch(() => undefined);
  }, []);

  return (
    <PanelShell title="კურიერის პანელი" subtitle="მიწოდების მართვა" backHref="/">
      <div className="mb-4">
        <CourierOnlineToggle />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PanelCard
          href="/courier/available"
          title="ხელმისაწვდომი შეკვეთები"
          count={counts.available}
          iconBg="bg-[#DBEAFE] text-[#1D4ED8]"
          icon={<OrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/courier/active"
          title="ჩემი აქტიური"
          count={counts.myActive}
          iconBg="bg-[#FFEDD5] text-[#C2410C]"
          icon={<ActiveOrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/courier/history"
          title="ისტორია"
          count={counts.delivered}
          iconBg="bg-[#DCFCE7] text-[#15803D]"
          icon={<CourierIcon className="size-7" />}
        />
      </div>
    </PanelShell>
  );
}
