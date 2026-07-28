import AdminSettingsForm, {
  type AdminProfile,
} from "@/components/admin/AdminSettingsForm";
import PanelShell from "@/components/panels/PanelShell";
import { requireAuth } from "@/lib/auth-guard";
import { serverApiFetch } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAuth(["ADMIN"]);

  let user: AdminProfile | null = null;
  try {
    const data = await serverApiFetch<{ user: AdminProfile }>("/admin/settings");
    user = data.user;
  } catch {
    redirect("/admin");
  }

  if (!user) redirect("/admin");

  return (
    <PanelShell
      title="პარამეტრები"
      subtitle="შენი ანგარიშის მონაცემები"
      backHref="/admin"
    >
      <AdminSettingsForm profile={user} />
    </PanelShell>
  );
}
