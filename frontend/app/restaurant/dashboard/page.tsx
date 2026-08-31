import { fetchDashboardServer } from "@/lib/restaurant/api.server";
import RestaurantDashboard from "@/components/restaurant/dashboard/RestaurantDashboard";

export default async function DashboardPage() {
  let data = null;
  try {
    data = await fetchDashboardServer();
  } catch {
    data = null;
  }

  return <RestaurantDashboard initialData={data} />;
}
