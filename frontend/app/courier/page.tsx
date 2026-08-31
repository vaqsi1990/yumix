import PanelCard from "@/components/panels/PanelCard";
import PanelShell from "@/components/panels/PanelShell";
import {
  ActiveOrdersIcon,
  CourierIcon,
  OrdersIcon,
} from "@/components/panels/icons";
import { serverApiFetch } from "@/lib/session";

export default async function CourierDashboardPage() {
  let available = 0;
  let myActive = 0;
  let delivered = 0;

  try {
    const data = await serverApiFetch<{
      availableCount: number;
      myActiveCount: number;
      deliveredCount: number;
    }>("/courier/dashboard");
    available = data.availableCount;
    myActive = data.myActiveCount;
    delivered = data.deliveredCount;
  } catch {
    // empty counts on failure
  }

  return (
    <PanelShell
      title="კურიერის პანელი"
      subtitle="მიწოდების მართვა"
      backHref="/"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PanelCard
          href="/courier/available"
          title="ხელმისაწვდომი შეკვეთები"
          count={available}
          iconBg="bg-[#DBEAFE] text-[#1D4ED8]"
          icon={<OrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/courier/active"
          title="ჩემი აქტიური"
          count={myActive}
          iconBg="bg-[#FFEDD5] text-[#C2410C]"
          icon={<ActiveOrdersIcon className="size-7" />}
        />
        <PanelCard
          href="/courier/history"
          title="ისტორია"
          count={delivered}
          iconBg="bg-[#DCFCE7] text-[#15803D]"
          icon={<CourierIcon className="size-7" />}
        />
      </div>
    </PanelShell>
  );
}
