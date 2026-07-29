import PanelShell from "@/components/panels/PanelShell";
import { VEHICLE_KA } from "@/lib/admin/labels";
import { serverApiFetch } from "@/lib/session";
import type { VehicleType } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminCourier = {
  id: string;
  vehicleType: VehicleType;
  isOnline: boolean;
  rating: number | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export default async function AdminCouriersPage() {
  let couriers: AdminCourier[] = [];
  try {
    const data = await serverApiFetch<{ couriers: AdminCourier[] }>(
      "/admin/couriers",
    );
    couriers = data.couriers;
  } catch {
    couriers = [];
  }

  return (
    <PanelShell
      title={"\u10d9\u10e3\u10e0\u10d8\u10d4\u10e0\u10d4\u10d1\u10d8"}
      subtitle={`\u10e1\u10e3\u10da: ${couriers.length}`}
      backHref="/admin"
    >
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="min-w-full text-left text-[16px] ">
          <thead className="bg-[#F3F4F6] text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">{"\u10e1\u10d0\u10ee\u10d4\u10da\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10d4\u10da\u10e4\u10dd\u10e1\u10e2\u10d0"}</th>
              <th className="px-4 py-3 font-medium">{"\u10e2\u10d4\u10da\u10d4\u10e4\u10dd\u10dc\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10e2\u10e0\u10d0\u10dc\u10e1\u10de\u10dd\u10e0\u10e2\u10d8"}</th>
              <th className="px-4 py-3 font-medium">{"\u10dd\u10dc\u10da\u10d0\u10d8\u10dc"}</th>
              <th className="px-4 py-3 font-medium">{"\u10e0\u10d4\u10d8\u10e2\u10d8\u10dc\u10d2\u10d8"}</th>
            </tr>
          </thead>
          <tbody>
            {couriers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  {"\u10d9\u10e3\u10e0\u10d8\u10d4\u10e0\u10d4\u10d1\u10d8 \u10ef\u10d4\u10e0 \u10d0\u10e0 \u10d0\u10e0\u10d8\u10e1"}
                </td>
              </tr>
            ) : (
              couriers.map((courier) => (
                <tr key={courier.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">
                    {courier.user.firstName} {courier.user.lastName}
                  </td>
                  <td className="px-4 py-3">{courier.user.email}</td>
                  <td className="px-4 py-3">{courier.user.phone}</td>
                  <td className="px-4 py-3">{VEHICLE_KA[courier.vehicleType]}</td>
                  <td className="px-4 py-3">
                    {courier.isOnline
                      ? "\u10dd\u10dc\u10da\u10d0\u10d8\u10dc"
                      : "\u10dd\u10e4\u10da\u10d0\u10d8\u10dc"}
                  </td>
                  <td className="px-4 py-3">
                    {courier.rating != null ? courier.rating.toFixed(1) : "\u2014"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
