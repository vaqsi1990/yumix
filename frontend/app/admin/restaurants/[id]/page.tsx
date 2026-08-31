import AdminRestaurantDetailPage from "@/components/admin/restaurants/AdminRestaurantDetailPage";
import PanelShell from "@/components/panels/PanelShell";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRestaurantDetailRoutePage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <PanelShell
      title="რესტორანი"
      subtitle="დეტალები"
      backHref="/admin/restaurants"
    >
      <AdminRestaurantDetailPage restaurantId={id} />
    </PanelShell>
  );
}
