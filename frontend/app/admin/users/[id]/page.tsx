import AdminUserDetailPage from "@/components/admin/AdminUserDetailPage";
import PanelShell from "@/components/panels/PanelShell";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function AdminUserDetailRoutePage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireAuth(["ADMIN"]);
  const { id } = await params;
  const { edit } = await searchParams;

  return (
    <PanelShell
      title="მომხმარებელი"
      subtitle="დეტალები"
      backHref="/admin/users"
    >
      <AdminUserDetailPage
        userId={id}
        currentUserId={session.user.id}
        initialEdit={edit === "1"}
      />
    </PanelShell>
  );
}
