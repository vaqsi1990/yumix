import AdminFavoriteFoodsManager, {
  type AdminFavoriteFood,
} from "@/components/admin/AdminFavoriteFoodsManager";
import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminFavoriteFoodsPage() {
  let items: AdminFavoriteFood[] = [];

  try {
    const data = await serverApiFetch<{ items: AdminFavoriteFood[] }>(
      "/admin/favorite-foods",
    );
    items = data.items;
  } catch {
    items = [];
  }

  return (
    <PanelShell
      title="სასურველი საკვები"
      subtitle={`სულ: ${items.length} · აირჩიე რა გამოჩნდება მთავარ გვერდზე`}
      backHref="/admin"
    >
      <AdminFavoriteFoodsManager items={items} />
    </PanelShell>
  );
}
