import AdminEditRestaurantPage from "@/components/admin/restaurants/AdminEditRestaurantPage";
import type { RestaurantOwnerCandidate } from "@/components/admin/restaurants/form/OwnerUserPicker";
import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditRestaurantRoutePage({
  params,
}: PageProps) {
  const { id } = await params;
  let users: RestaurantOwnerCandidate[] = [];

  try {
    const data = await serverApiFetch<{ users: RestaurantOwnerCandidate[] }>(
      "/admin/users",
    );
    users = data.users;
  } catch {
    users = [];
  }

  return (
    <PanelShell
      title="რესტორნის რედაქტირება"
      subtitle="ცვლილებების შენახვა"
      backHref={`/admin/restaurants/${id}`}
    >
      <AdminEditRestaurantPage restaurantId={id} users={users} />
    </PanelShell>
  );
}
