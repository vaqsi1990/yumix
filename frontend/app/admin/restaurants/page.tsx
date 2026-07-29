import AdminRestaurantsPage from "@/components/admin/restaurants/AdminRestaurantsPage";
import PanelShell from "@/components/panels/PanelShell";

export const dynamic = "force-dynamic";

export default function AdminRestaurantsRoutePage() {
  return (
    <PanelShell
      title="რესტორნები"
      subtitle="მენეჯმენტი"
      backHref="/admin"
    >
      <AdminRestaurantsPage />
    </PanelShell>
  );
}
