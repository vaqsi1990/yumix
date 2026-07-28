import AdminCreateRestaurantPage from "@/components/admin/restaurants/AdminCreateRestaurantPage";
import PanelShell from "@/components/panels/PanelShell";

export const dynamic = "force-dynamic";

export default function AdminNewRestaurantPage() {
  return (
    <PanelShell
      title="ახალი რესტორანი"
      subtitle="რესტორნის რეგისტრაცია · mock რეჟიმი"
      backHref="/admin/restaurants"
    >
      <AdminCreateRestaurantPage />
    </PanelShell>
  );
}
