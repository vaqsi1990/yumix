import AccountOrdersClient from "@/components/account/AccountOrdersClient";
import { serverApiFetch } from "@/lib/session";
import type { CustomerOrder } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  let orders: CustomerOrder[] = [];
  try {
    const data = await serverApiFetch<{ orders: CustomerOrder[] }>("/orders");
    orders = data.orders;
  } catch {
    orders = [];
  }

  return <AccountOrdersClient orders={orders} />;
}
