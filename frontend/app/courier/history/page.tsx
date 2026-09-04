import CourierPageHeader from "@/components/courier/CourierPageHeader";
import { serverApiFetch } from "@/lib/session";

type HistoryOrder = {
  id: string;
  orderNumber: string;
  total: number;
  restaurant: { name: string };
};

export default async function CourierHistoryPage() {
  let orders: HistoryOrder[] = [];
  try {
    const data = await serverApiFetch<{ orders: HistoryOrder[] }>(
      "/courier/history",
    );
    orders = data.orders;
  } catch {
    orders = [];
  }

  return (
    <div>
      <CourierPageHeader title="მიწოდების ისტორია" />
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F3F4F6] text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">ნომერი</th>
              <th className="px-4 py-3 font-medium">რესტორანი</th>
              <th className="px-4 py-3 font-medium">თანხა</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  ისტორია ცარიელია
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.restaurant.name}</td>
                  <td className="px-4 py-3">₾{order.total.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
