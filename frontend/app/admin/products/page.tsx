import AdminProductsPage from "@/components/admin/products/AdminProductsPage";
import PanelShell from "@/components/panels/PanelShell";

export const dynamic = "force-dynamic";

export default function AdminProductsRoutePage() {
  return (
    <PanelShell
      title="პროდუქტები"
      subtitle="მენეჯმენტი"
      backHref="/admin"
    >
      <AdminProductsPage />
    </PanelShell>
  );
}
