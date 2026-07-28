import AdminRestaurantDetailPage from "@/components/admin/restaurants/AdminRestaurantDetailPage";
import PanelShell from "@/components/panels/PanelShell";
import { getRestaurantById } from "@/components/admin/restaurants/mock-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRestaurantDetailRoutePage({
  params,
}: PageProps) {
  const { id } = await params;
  const restaurant = getRestaurantById(id);

  return (
    <PanelShell
      title={restaurant?.name ?? "რესტორანი"}
      subtitle={restaurant ? `${restaurant.city} · დეტალები` : undefined}
      backHref="/admin/restaurants"
    >
      <AdminRestaurantDetailPage restaurantId={id} />
    </PanelShell>
  );
}
