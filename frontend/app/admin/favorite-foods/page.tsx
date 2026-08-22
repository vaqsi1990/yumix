import AdminFavoriteFoodsManager, {
  normalizeFavoriteFoodItems,
} from "@/components/admin/AdminFavoriteFoodsManager";
import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminFavoriteFoodsPage() {
  let items: AdminFavoriteFood[] = [];

  try {
    const data = await serverApiFetch<{ items?: unknown[] }>(
      "/admin/favorite-foods",
    );
    items = normalizeFavoriteFoodItems(data.items);
  } catch {
    items = [];
  }

  return (
    <PanelShell
      title="სასურველი საკვები"
      subtitle={`სულ: ${items.length} · აირჩიე რა საჭმელი გამოჩნდება მთავარ გვერდზე`}
      backHref="/admin"
    >
      <AdminFavoriteFoodsManager items={items} />
    </PanelShell>
  );
}
