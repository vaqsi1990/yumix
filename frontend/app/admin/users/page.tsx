import AdminUsersManager, {
  type AdminUserRow,
} from "@/components/admin/AdminUsersManager";
import PanelShell from "@/components/panels/PanelShell";
import { requireAuth } from "@/lib/auth-guard";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAuth(["ADMIN"]);

  let users: AdminUserRow[] = [];
  try {
    const data = await serverApiFetch<{ users: AdminUserRow[] }>("/admin/users");
    users = data.users;
  } catch {
    users = [];
  }

  return (
    <PanelShell
      title="მომხმარებლები"
      subtitle={`სულ: ${users.length}`}
      backHref="/admin"
    >
      <AdminUsersManager users={users} currentUserId={session.user.id} />
    </PanelShell>
  );
}
