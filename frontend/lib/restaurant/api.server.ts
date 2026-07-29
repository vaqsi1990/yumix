import { serverApiFetch } from "@/lib/session";
import type { ApiUser } from "@/lib/api";
import type {
  DashboardStats,
  PopularProduct,
  RestaurantOrder,
  RestaurantReview,
  RestaurantSummary,
  ShellData,
} from "./types";

export async function fetchShellData(): Promise<ShellData> {
  try {
    return await serverApiFetch<ShellData>("/restaurant/shell");
  } catch {
    const account = await serverApiFetch<{ user: ApiUser }>("/restaurant/account");
    try {
      const dashboard = await serverApiFetch<{
        restaurant: RestaurantSummary;
        stats: DashboardStats;
      }>("/restaurant/dashboard");
      return {
        hasRestaurant: true,
        restaurant: dashboard.restaurant,
        owner: account.user,
        pendingOrders: dashboard.stats.pendingOrders,
      };
    } catch {
      return {
        hasRestaurant: false,
        owner: account.user,
        pendingOrders: 0,
      };
    }
  }
}

export async function fetchDashboardServer() {
  return serverApiFetch<{
    restaurant: RestaurantSummary;
    activeOrdersCount: number;
    stats: DashboardStats;
    recentOrders: RestaurantOrder[];
    latestReviews: RestaurantReview[];
    popularProducts: PopularProduct[];
  }>("/restaurant/dashboard");
}
