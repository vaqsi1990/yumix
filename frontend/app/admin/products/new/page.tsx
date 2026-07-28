import AdminProductFormPage from "@/components/admin/products/AdminProductFormPage";
import PanelShell from "@/components/panels/PanelShell";

export const dynamic = "force-dynamic";

export default function AdminNewProductPage() {
  return (
    <PanelShell
      title="ახალი პროდუქტის დამატება"
      subtitle="შეავსეთ პროდუქტის ინფორმაცია"
      backHref="/admin/products"
    >
      <div className="-mx-4 rounded-xl bg-[#F3F4F6] p-4 sm:-mx-6 sm:p-6">
        <AdminProductFormPage />
      </div>
    </PanelShell>
  );
}
