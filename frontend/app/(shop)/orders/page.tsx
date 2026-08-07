import Link from "next/link";
import { getSession, serverApiFetch } from "@/lib/session";
import { formatGel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "მოლოდინში",
  ACCEPTED: "მიღებული",
  PREPARING: "მზადდება",
  READY: "მზადაა",
  PICKED_UP: "აღებულია",
  ON_THE_WAY: "გზაშია",
  DELIVERED: "მიწოდებული",
  CANCELLED: "გაუქმებული",
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">ჩემი შეკვეთები</h1>
        <p className="mt-2 text-neutral-500">შეკვეთების სანახავად შედი ანგარიშში</p>
        <Link href="/login" className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-white">
          შესვლა
        </Link>
      </section>
    );
  }

  let orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    restaurant: { name: string; slug: string };
  }> = [];

  try {
    const data = await serverApiFetch<{ orders: typeof orders }>("/orders");
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">ჩემი შეკვეთები</h1>
      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-neutral-100 px-6 py-12 text-center">
          <p className="text-neutral-500">შეკვეთები ჯერ არ გაქვს</p>
          <Link href="/restaurants" className="mt-4 inline-flex text-[#FF0050] hover:underline">
            რესტორნების ნახვა
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-neutral-50"
              >
                <div>
                  <p className="font-semibold">#{order.orderNumber}</p>
                  <p className="text-sm text-neutral-500">{order.restaurant.name}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(order.createdAt).toLocaleString("ka-GE")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </p>
                  <p className="mt-1 font-bold">{formatGel(order.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
