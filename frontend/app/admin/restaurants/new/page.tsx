import AdminCreateRestaurantPage from "@/components/admin/restaurants/AdminCreateRestaurantPage";
import type { RestaurantOwnerCandidate } from "@/components/admin/restaurants/form/OwnerUserPicker";
import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminNewRestaurantPage() {
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
      title="ახალი რესტორანი"
      subtitle="რესტორნის რეგისტრაცია"
      backHref="/admin/restaurants"
    >
      <AdminCreateRestaurantPage users={users} />
    </PanelShell>
  );
}
