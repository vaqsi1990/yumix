import AdminSettingsForm, {
  type AdminProfile,
} from "@/components/admin/AdminSettingsForm";
import PanelShell from "@/components/panels/PanelShell";
import { requireAuth } from "@/lib/auth-guard";
import { serverApiFetch } from "@/lib/session";
import type { Address } from "@/lib/shop-api";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAuth(["ADMIN"]);

  let user: AdminProfile | null = null;
  let address: Address | null = null;
  try {
    const settingsData = await serverApiFetch<{ user: AdminProfile }>(
      "/admin/settings",
    );
    user = settingsData.user;
  } catch {
    redirect("/admin");
  }

  try {
    const addressData = await serverApiFetch<{ addresses: Address[] }>(
      "/addresses",
    );
    address =
      addressData.addresses.find((row) => row.isDefault) ??
      addressData.addresses[0] ??
      null;
  } catch {
    address = null;
  }

  if (!user) redirect("/admin");

  return (
    <PanelShell
      title="პარამეტრები"
      subtitle="შენი ანგარიშის მონაცემები"
      backHref="/admin"
    >
      <AdminSettingsForm profile={user} address={address} />
    </PanelShell>
  );
}
