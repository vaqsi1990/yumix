import AdminProductFormPage from "@/components/admin/products/AdminProductFormPage";
import PanelShell from "@/components/panels/PanelShell";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PanelShell
      title="პროდუქტის რედაქტირება"
      subtitle="განაახლეთ პროდუქტის ინფორმაცია"
      backHref="/admin/products"
    >
      <div className="-mx-4 rounded-xl bg-[#F3F4F6] p-4 sm:-mx-6 sm:p-6">
        <AdminProductFormPage productId={id} />
      </div>
    </PanelShell>
  );
}
